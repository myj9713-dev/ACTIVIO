-- 1. profiles 테이블에 email_value 컬럼 추가 (이미 있으면 건너뜀)
alter table public.profiles
add column if not exists email_value text;

-- 2. 신규 가입자 트리거 함수 갱신 (email_value 동기화 포함)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email_value, nickname, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'nickname',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update
  set email_value = coalesce(public.profiles.email_value, excluded.email_value);

  return new;
end;
$$;

-- 3. 트리거 재생성 (중복 생성 방지)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. 기존 유저 중 email_value가 비어 있는 계정 백필(멱등성 보장)
update public.profiles p
set email_value = u.email
from auth.users u
where p.id = u.id
  and (p.email_value is null or p.email_value = '')
  and u.email is not null;