import { create_record } from '../../helpers';

export const create_disposition = async (data) => {
    return await create_record('dispositions', data);
}