import React, { useEffect, useRef } from 'react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en);

const Reply = (props) => {

    const replyContent = useRef();

    useEffect(() => {
        if(props.content){
            replyContent.current.innerHTML = props.content.body;
        }

    }, [props, replyContent]);

    const timeAgo = new TimeAgo('en-US');

    return (
        <div className='ReplyContainer'>
            <div className='Reply'>
                <img src={props.content.creator.photo_small} className='reply_profile' alt='Replier' />
                <div className='reply_content_container'>
                    <div style={{color: '#0073ea'}}>
                        { props.content && props.content.creator.name }
                    </div>
                    <div ref={replyContent} className='replybody_format' />
                </div>
                <div style={{marginLeft: '50px', color: '#9699a6', fontSize: '13px'}}>{timeAgo.format(new Date(props.content.created_at))}</div>
            </div>
            
        </div>
    );
}

export default Reply;