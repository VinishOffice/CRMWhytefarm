import React,{useState,useEffect,useContext} from 'react';
import { fetch_all_records,create_record,delete_record } from '../../helpers';
import Swal from 'sweetalert2';
import { Spinner } from 'react-bootstrap';
import GlobalContext from '../../context/GlobalContext';
const Tags = () => {
    const {permissible_roles} = useContext(GlobalContext);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    useEffect(() => {
        fetch_all_records('tags').then((data) => {
            setTags(data);
            setLoading(false);
        });
    }
    , [refresh])

    const create_new_tag = () => {
        if(!permissible_roles.includes('add_tags')){
            rolePermission();
            return;

        }
        setSubmitLoading(true);
        const tag_name = document.getElementById('tag_name').value;
        document.getElementById('tag_name').value = '';
        const tag_data = {
            "tag_name": tag_name
        }
        if(tag_name === ''){
            alert('Please enter a tag name');
            return;
        }
        create_record('tags', tag_data).then((data) => {
            setSubmitLoading(false);
            setRefresh(!refresh);
        });
    }

    const deleteTag = (doc_id) => {
        if(!permissible_roles.includes('delete_tags')){
            rolePermission();
            return;

        }
        setLoading(true);
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete the tag? This action is irreversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                delete_record('tags', doc_id).then((data) => {
                    if (data) {
                        setLoading(false);
                        setRefresh(!refresh);
                    }
                });
            }
        });
    }

    const rolePermission = () => {
        const Toast = Swal.mixin({
            toast: true,
            background: '#d7e7e6',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: 'error',
            title: 'You are not authorised to do this action'
        });

    }



    if(loading){
        return (
            <div className="d-flex justify-content-center align-items-center" >
                <Spinner animation="border" variant="primary" />
            </div>
        )
    }
  return (
    <div>
        <div className='form'>
            <div className="form-group">
                <label htmlFor="tag_name">Tag Name</label>
                <input type="text" className="form-control" id="tag_name" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitLoading} onClick={()=>{create_new_tag()}}>
                {submitLoading ? 'Creating...' : 'Create Tag'}
            </button>
        </div>
        <div className="d-flex flex-wrap mt-2" style={{gap:"5px"}}>
            {tags.map((tag) => (
            <div key={tag.doc_id} className='mt-2'>
                <span className='subdispo_chip'>{tag.data.tag_name}<button className='remove_subdispo' onClick={()=>{deleteTag(tag.id)}}>X</button></span>
            </div>
            ))}
        </div>
    </div>
  )
}

export default Tags