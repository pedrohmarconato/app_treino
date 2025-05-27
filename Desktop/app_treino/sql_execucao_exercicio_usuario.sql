-- Tabela para registrar execuções reais do usuário em cada exercício do treino
create table if not exists execucao_exercicio_usuario (
    id serial primary key,
    usuario_id bigint not null references usuarios(id),
    protocolo_treino_id bigint not null references protocolo_treinos(id),
    exercicio_id bigint not null references exercicios(id),
    data_execucao timestamp with time zone default now(),
    peso_utilizado numeric(6,2) not null,
    repeticoes integer not null,
    falhou boolean default false,
    observacoes text,
    created_at timestamp with time zone default now()
);

alter table execucao_exercicio_usuario enable row level security;
create policy "Public read" on execucao_exercicio_usuario for select using (true);
create policy "Public insert" on execucao_exercicio_usuario for insert with check (true);
