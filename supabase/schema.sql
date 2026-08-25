
create table members(
 id uuid primary key default gen_random_uuid(),
 name text unique not null,
 created_at timestamptz default now()
);

create table profit_records(
 id uuid primary key default gen_random_uuid(),
 member_name text not null,
 record_date date not null,
 profit numeric not null,
 remark text,
 created_at timestamptz default now(),
 unique(member_name,record_date)
);
