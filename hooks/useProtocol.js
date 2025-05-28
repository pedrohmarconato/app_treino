// hooks/useProtocol.js
// Hooks customizados para consumir os serviços de protocolo

import {
    fetchUsuarios,
    fetchProximoTreino,
    fetchExerciciosTreino,
    fetch1RMUsuario,
    fetchMetricasUsuario,
    fetchDadosIndicadores,
    fetchGruposMuscularesTreinos,
    salvarExecucaoExercicio
} from '../services/protocolService.js';

export function useUsuarios() {
    const [usuarios, setUsuarios] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        fetchUsuarios()
            .then(setUsuarios)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return { usuarios, loading, error };
}

export function useProximoTreino(userId, protocoloId) {
    const [treino, setTreino] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!userId || !protocoloId) return;
        fetchProximoTreino(userId, protocoloId)
            .then(setTreino)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId, protocoloId]);

    return { treino, loading, error };
}

export function useExerciciosTreino(numeroTreino, protocoloId) {
    const [exercicios, setExercicios] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!numeroTreino || !protocoloId) return;
        fetchExerciciosTreino(numeroTreino, protocoloId)
            .then(setExercicios)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [numeroTreino, protocoloId]);

    return { exercicios, loading, error };
}

// Outros hooks podem ser criados seguindo o mesmo padrão para as demais funções de serviço.
