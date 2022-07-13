import React, { useEffect, useRef, useState } from 'react';
import { Button } from "monday-ui-react-core";
import JoditEditor from "jodit-react";
import Reply from './Reply';
const DropdownChevronDown = require('./Chevron.svg');

const Update = (props) => {

    const updateContent = useRef();
    const [newReply, setReply] = useState('');
    const [showingEditor, toggleEditor] = useState(false);
    const [config, setConfig] = useState({
        toolbar: false,
        placeholder: 'Write a reply...',
        tabIndex: 0,
        height: 'auto',
        minHeight: 80
    });

    const showEditor = (e) => {
        if(!showingEditor){
            toggleEditor(!showingEditor);
        }
    }

    const hideEditor = () => {
        if(showingEditor && newReply.replaceAll("&nbsp;","").replaceAll("<p><br></p>","").trim() === ""){
            toggleEditor(!showingEditor);
            setReply("");
        }
    }

    const replyEditor = <JoditEditor
                            config={config}
                            value={newReply}
                            onBlur={hideEditor}
                            onChange={setReply}/>;

    useEffect(() => {
        if(props.content){
            updateContent.current.innerHTML = props.content.body;
        }
    }, [updateContent, props.content]);

    useEffect(() => {
        let divBorderFix = document.getElementsByClassName('jodit-container jodit jodit_theme_default jodit-wysiwyg_mode');
        for(let d of divBorderFix){
            d.style.border = '0';
        }
    },[]);

    const expandUpdate = (e) => {
        updateContent.current.className = 'update_content_expanded';
        e.target.parentNode.style.display = 'none';
        console.log("Target", e.target.parentNode);
    }

    return (
        <div className='Update'>
            <div className='UpdateHeader'>
                <div className='title'>
                    <div>
                        <img src={props.content.creator.photo_small} className='update_profile_icon'/>
                    </div>
                    <div className='name'>
                        {
                            props.content && props.content.creator.name
                        }
                    </div>
                </div>
            </div>
            <div ref={updateContent} className='update_content' />
            {
                props.content && props.content.body.length > 500 ? (
                    <div className='update_content_read_more'><Button onClick={expandUpdate} className='btn-readmore' size={Button.sizes.SMALL}>Read More &nbsp;<img src={DropdownChevronDown} style={{pointerEvents: 'none'}}/></Button></div>
                ):''
            }
            <div className='update_replies'>
                <div>
                    {
                        props.content && props.content.replies.map((reply) => {
                            return <Reply key={reply.id} content={reply} />
                        })
                    }
                </div>
            </div>
            <div className='p-relative p-2'>
                <img src={props.photo} className='new_reply_profile' />
                <div onClick={showEditor} className={showingEditor?'reply_preview_container_opened':'reply_preview_container_closed'}>
                    <style>
                        {`.jodit-status-bar { display: none; }
                        .jodit-add-new-line_after { display: none }`}
                    </style>
                    { replyEditor }                    
                </div>
                <div className={showingEditor?'d-flex mt-1 jf-end':'d-none mt-1 jf-end'}>
                    <Button size={Button.sizes.SMALL}>Reply</Button>
                </div>
            </div>
        </div>
    );
}

export default Update;