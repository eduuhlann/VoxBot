const supabase = require('./supabase');

module.exports = {
    prepare: () => ({
        get: async (id) => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('discord_id', id)
                .single();
            if (error && error.code !== 'PGRST116') console.error('Erro DB Get:', error);
            return data;
        },
        run: async (...args) => {
            // Lógica para identificar o que atualizar com base no número de argumentos
            try {
                if (args.length === 2) {
                    // Caso 1: !editar (Imagem, ID)
                    await supabase.from('users').update({ rpc_large_image: args[0] }).eq('discord_id', args[1]);
                } else if (args.length === 4) {
                    // Caso 2: Modal (Nome, Detalhes, Estado, ID)
                    await supabase.from('users').update({
                        rpc_name: args[0],
                        rpc_details: args[1],
                        rpc_state: args[2]
                    }).eq('discord_id', args[3]);
                }
            } catch (err) {
                console.error('Erro DB Run:', err);
            }
        }
    })
};