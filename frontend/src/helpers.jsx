import apiClient from "./services/apiClient";

export const normalizeDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value.seconds !== undefined) return new Date(value.seconds * 1000);
    if (typeof value.toDate === "function") return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const create_record = async (collectionName, data) => {
    try {
        data['created_at'] = new Date();
        const response = await apiClient.post(`/api/${collectionName}/add`, data);
        
        // Agar backend success return karta hai
        return { success: true, data: response.data };
    } catch (error) {
        // Backend se aane wala error message nikalna
        const message = error.response?.data?.details || error.response?.data?.error || "Something went wrong";
        return { success: false, error: message };
    }
}

export const update_record = async (collectionName, id, data) => {
    try {
        data['updated_at'] = new Date();
        const response = await apiClient.put(`/api/${collectionName}/${id}`, data);
        
        return { success: true, data: response.data };
    } catch (error) {
        const message = error.response?.data?.details || error.response?.data?.error || "Update failed";
        return { success: false, error: message };
    }
}

export const fetch_records = async(collections, query, require_sorting=false, orderByField = 'created_at', orderDirection = 'desc') => {
    try {
        const filters = query.map(q => ({ field: q.key, op: q.operator, value: q.value }));
        const sort = require_sorting ? [{ field: orderByField, direction: orderDirection }] : [];
        
        const docs = await apiClient.post(`/api/${collections}/query`, { filters, sort })
            .then(res => res.data?.data || []);
            
        return docs.map(doc => ({ id: doc._id || doc.id, data: doc }));
    } catch (error) {
        return [];
    }
}

export const fetch_records_with_limit = async(collectionName, {key, value, operator }) => {
    try {
        const docs = await apiClient.post(`/api/${collectionName}/query`, {
            filters: [{ field: key, op: operator, value: value }],
            limit: 1
        }).then(res => res.data?.data || []);
        
        return docs[0] || null;
    } catch (error) {
        return null;
    }
}

export const delete_record = async (collectionName, id) => {
    try {
        await apiClient.delete(`/api/${collectionName}/${id}`);
        return true;
    } catch (error) {
        return false;
    }
}

export const fetch_all_records = async (collectionName) => {
    try {
        const docs = await apiClient.post(`/api/${collectionName}/query`, { filters: [] })
            .then(res => res.data?.data || []);
        return docs.map(doc => ({ id: doc._id || doc.id, data: doc }));
    } catch (error) {
        return [];
    }
}


export const generate_random_id = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
  
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    return result;
  };

export const fetch_records_with_pagination = async (collections, query, lastDoc = null, require_sorting = false, orderByField = 'created_at', orderDirection = 'desc', page = 1, limit = 50) => {
    try {
        const filters = query.map(q => ({ field: q.key, op: q.operator, value: q.value }));
        const sort = require_sorting ? [{ field: orderByField, direction: orderDirection }] : [];
        
        const response = await apiClient.post(`/api/${collections}/query`, {
            filters,
            sort,
            page,
            limit
        }).then(res => res.data || {});

        const docs = response.data || [];
        const totalCount = response.pagination?.total || docs.length;
        const totalPages = response.pagination?.pages || Math.ceil(totalCount / limit);

        return {
            data: docs.map(doc => ({ id: doc._id || doc.id, data: doc })),
            totalCount,
            currentPage: page,
            totalPages,
            lastVisible: null // Pagination is now page-based
        };
    } catch (error) {
        return {
            data: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0
        };
    }
};


