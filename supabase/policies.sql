
alter table members enable row level security;
alter table profit_records enable row level security;

create policy "public read members" on members for select using (true);
create policy "public insert members" on members for insert with check (true);
create policy "public update members" on members for update using (true) with check (true);
create policy "public read" on profit_records for select using (true);
create policy "public insert" on profit_records for insert with check (true);
create policy "public update" on profit_records for update using (true) with check (true);
