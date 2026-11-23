-- 1. 신규 auth.users 생성 시 public.profiles 기본 행을 자동 생성하는 함수
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
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
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2. 트리거 재생성 (중복 생성 방지)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. 기존 auth.users 중 public.profiles 누락 계정에 대한 멱등성 백필
insert into public.profiles (id, nickname, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'nickname',
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ) as nickname,
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  ) as avatar_url
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;