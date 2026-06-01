import { useCallback } from "react";
import api from "../../services/api";

const useHelps = () => {

    const findAll = useCallback(async (params) => {
        const { data } = await api.request({
            url: `/helps`,
            method: 'GET',
            params
        });
        return data;
    }, []);

    const list = useCallback(async (params) => {
        const { data } = await api.request({
            url: '/helps/list',
            method: 'GET',
            params
        });
        return data;
    }, []);

    const save = useCallback(async (data) => {
        const { data: responseData } = await api.request({
            url: '/helps',
            method: 'POST',
            data
        });
        return responseData;
    }, []);

    const update = useCallback(async (data) => {
        const { data: responseData } = await api.request({
            url: `/helps/${data.id}`,
            method: 'PUT',
            data
        });
        return responseData;
    }, []);

    const remove = useCallback(async (id) => {
        const { data } = await api.request({
            url: `/helps/${id}`,
            method: 'DELETE'
        });
        return data;
    }, []);

    return {
        findAll,
        list,
        save,
        update,
        remove
    }
}

export default useHelps;