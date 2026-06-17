require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Envia o painel de tickets'),

    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Envia regras e termos'),

    new SlashCommandBuilder()
        .setName('catalogo')
        .setDescription('Envia o catálogo das contas nitradas'),

    new SlashCommandBuilder()
        .setName('nitrolink')
        .setDescription('Envia o catálogo de Nitro Link no canal específico'),

    new SlashCommandBuilder()
        .setName('impulsos')
        .setDescription('Envia o catálogo de impulsos no canal de impulsos'),

    new SlashCommandBuilder()
        .setName('estoque')
        .setDescription('Gerencia o estoque da loja')

        .addSubcommand(sub =>
            sub

                .setName('adicionar')

                .setDescription('Adiciona itens ao estoque')

                .addStringOption(opt =>
                    opt

                        .setName('produto')

                        .setDescription('Nome do produto')

                        .setRequired(true)
                )

                .addIntegerOption(opt =>
                    opt

                        .setName('quantidade')

                        .setDescription('Quantidade para adicionar')

                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub

                .setName('remover')

                .setDescription('Remove itens do estoque')

                .addStringOption(opt =>
                    opt

                        .setName('produto')

                        .setDescription('Nome do produto')

                        .setRequired(true)
                )

                .addIntegerOption(opt =>
                    opt

                        .setName('quantidade')

                        .setDescription('Quantidade para remover')

                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub

                .setName('ver')

                .setDescription('Mostra o estoque')

                .addStringOption(opt =>
                    opt

                        .setName('produto')

                        .setDescription('Produto específico')

                        .setRequired(false)
                )
        ),

    new SlashCommandBuilder()

        .setName('venda')

        .setDescription('Registra uma venda')

        .addSubcommand(sub =>
            sub

                .setName('registrar')

                .setDescription('Registrar venda no sistema')

                .addStringOption(opt =>
                    opt

                        .setName('cliente')

                        .setDescription('Nome do cliente')

                        .setRequired(true)
                )

                .addStringOption(opt =>
                    opt

                        .setName('produto')

                        .setDescription('Produto vendido')

                        .setRequired(true)
                )

                .addNumberOption(opt =>
                    opt

                        .setName('valor')

                        .setDescription('Valor total da venda')

                        .setRequired(true)
                )

                .addNumberOption(opt =>
                    opt

                        .setName('custo')

                        .setDescription('Custo total da venda')

                        .setRequired(true)
                )

                .addStringOption(opt =>
                    opt

                        .setName('pagamento')

                        .setDescription('Forma de pagamento')

                        .setRequired(true)
                )

                .addIntegerOption(opt =>
                    opt

                        .setName('quantidade')

                        .setDescription('Quantidade vendida')

                        .setRequired(false)
                )
        ),

    new SlashCommandBuilder()

        .setName('cupom')

        .setDescription('Gerencia cupons')

        .addSubcommand(sub =>
            sub

                .setName('criar')

                .setDescription('Cria um novo cupom')

                .addStringOption(opt =>
                    opt

                        .setName('nome')

                        .setDescription('Nome do cupom')

                        .setRequired(true)
                )

                .addIntegerOption(opt =>
                    opt

                        .setName('desconto')

                        .setDescription('Desconto em %')

                        .setRequired(true)
                )

                .addStringOption(opt =>
                    opt

                        .setName('validade')

                        .setDescription('Validade do cupom')

                        .setRequired(true)
                )

                .addIntegerOption(opt =>
                    opt

                        .setName('usos')

                        .setDescription('Quantidade máxima de usos')

                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub

                .setName('deletar')

                .setDescription('Deleta um cupom')

                .addStringOption(opt =>
                    opt

                        .setName('nome')

                        .setDescription('Nome do cupom')

                        .setRequired(true)
                )
        ),

    new SlashCommandBuilder()

        .setName('stats')

        .setDescription('Mostra as estatísticas da loja'),

    // ===== NOVOS COMANDOS =====

    // Sistema de Avaliações
    new SlashCommandBuilder()
        .setName('avaliar')
        .setDescription('Deixe uma avaliação da Flash Store')
        .addIntegerOption(opt =>
            opt
                .setName('estrelas')
                .setDescription('Nota de 1 a 5 estrelas')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption(opt =>
            opt
                .setName('comentario')
                .setDescription('Comentário opcional')
                .setRequired(false)
        ),

    // Painel Principal
    new SlashCommandBuilder()
        .setName('painel-dash')
        .setDescription('Mostra o painel principal da Flash Store'),

    // Gerenciamento de Backups
    new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Gerencia backups do banco de dados')
        .addSubcommand(sub =>
            sub
                .setName('criar')
                .setDescription('Cria um novo backup')
        )
        .addSubcommand(sub =>
            sub
                .setName('listar')
                .setDescription('Lista todos os backups')
        )
        .addSubcommand(sub =>
            sub
                .setName('restaurar')
                .setDescription('Restaura um backup')
                .addStringOption(opt =>
                    opt
                        .setName('arquivo')
                        .setDescription('Nome do arquivo de backup')
                        .setRequired(true)
                )
        ),

    // Configuração Anti-Spam
    new SlashCommandBuilder()
        .setName('config-spam')
        .setDescription('Configura o sistema anti-spam')
        .addSubcommand(sub =>
            sub
                .setName('limiar')
                .setDescription('Define o limite de mensagens')
                .addIntegerOption(opt =>
                    opt
                        .setName('quantidade')
                        .setDescription('Quantidade de ações permitidas')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('reset')
                .setDescription('Reseta os avisos de um usuário')
                .addUserOption(opt =>
                    opt
                        .setName('usuario')
                        .setDescription('Usuário para resetar')
                        .setRequired(true)
                )
        ),

    // Configuração de Estoque
    new SlashCommandBuilder()
        .setName('config-estoque')
        .setDescription('Configura alertas e limites de estoque')
        .addSubcommand(sub =>
            sub
                .setName('limiar')
                .setDescription('Define o limite de estoque baixo')
                .addIntegerOption(opt =>
                    opt
                        .setName('quantidade')
                        .setDescription('Quantidade mínima para alerta de estoque baixo')
                        .setRequired(true)
                )
        ),

    // Sistema de Metas
    new SlashCommandBuilder()
        .setName('metas')
        .setDescription('Gerencia as metas mensais')
        .addSubcommand(sub =>
            sub
                .setName('ver')
                .setDescription('Mostra o progresso da meta mensal')
        )
        .addSubcommand(sub =>
            sub
                .setName('definir')
                .setDescription('Define uma nova meta')
                .addIntegerOption(opt =>
                    opt
                        .setName('vendas')
                        .setDescription('Meta de vendas para o mês')
                        .setRequired(true)
                )
        ),

    // Sistema de Níveis
    new SlashCommandBuilder()
        .setName('niveis')
        .setDescription('Mostra o sistema de níveis dos clientes')
        .addSubcommand(sub =>
            sub
                .setName('meu-nivel')
                .setDescription('Mostra seu nível atual')
        )
        .addSubcommand(sub =>
            sub
                .setName('ranking')
                .setDescription('Mostra o ranking de níveis')
        ),

    // Vendas Hoje
    new SlashCommandBuilder()
        .setName('vendas-hoje')
        .setDescription('Mostra as vendas de hoje'),

    // Lucro
    new SlashCommandBuilder()
        .setName('lucro')
        .setDescription('Mostra informações de lucro')
        .addSubcommand(sub =>
            sub
                .setName('total')
                .setDescription('Mostra o lucro total')
        )
        .addSubcommand(sub =>
            sub
                .setName('hoje')
                .setDescription('Mostra o lucro de hoje')
        )

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const CLIENT_ID = '1515237130874392616';

const GUILD_ID = '1514854558222782534';

(async () => {

    try {

        console.log('Registrando comandos no servidor...');

        await rest.put(

            Routes.applicationGuildCommands(

                CLIENT_ID,

                GUILD_ID

            ),

            {

                body: commands

            }

        );

        console.log('✅ Comandos registrados com sucesso!');

    }

    catch (error) {

        console.error(error);

    }

})();