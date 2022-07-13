import React, { useEffect, useRef } from 'react';

const Reply = (props) => {

    const replyContent = useRef();

    useEffect(() => {
        if(props.content){
            replyContent.current.innerHTML = props.content.body;
        }

    }, [props, replyContent]);



    return (
        <div className='ReplyContainer'>
            <div className='Reply'>
                <img src={props.content.creator.photo_small} className='reply_profile' />
                <div className='reply_content_container'>
                    <div style={{color: '#0073ea'}}>
                        { props.content && props.content.creator.name }
                    </div>
                    <div ref={replyContent} className='replybody_format' />
                </div>
            </div>
        </div>
    );
}

export default Reply;