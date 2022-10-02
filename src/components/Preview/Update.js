import React, { useEffect, useRef, useState } from 'react';
import { Button } from "monday-ui-react-core";
import JoditEditor from "jodit-react";
import Select from 'react-select';
import Reply from './Reply';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
//TimeAgo.addDefaultLocale(en);
const DropdownChevronDown = require('./Chevron.svg');

const Update = (props) => {
    const timeAgo = new TimeAgo('en-US');
    const updateContent = useRef();
    const [newReply, setReply] = useState('');
    const [showingEditor, toggleEditor] = useState(false);
    const [atUsers, setTags] = useState([]);
    const [replies, setReplies] = useState(props.content.replies?props.content.replies:[]);
    const [writing, setWriting] = useState(false);

    const [lastChar, setChar] = useState('');
    const [lastKey, setKey] = useState(-1);

    //TAG Search mode
    const [isTagSearch, toggleTagSearch] = useState(false);
    const [tagSearchInit, setTagSearchInit] = useState(-1);
    const [tagSearchEnd, setTagSearchEnd] = useState(-1);
    const [tagSearch, setTagSearch] = useState('');

    const isTagSearchRef = useRef();
          isTagSearchRef.current = isTagSearch;

    const tagSearchRef = useRef();
          tagSearchRef.current = tagSearch;
    
    const [tagSelectorStyle, setSelectorStyle] = useState({
        display: 'none', 
        position: 'absolute', 
        top: '0', 
        left: '70px', 
        minWidth: '150px'}
    );
    const editorRef = useRef();

    const [config, setConfig] = useState({
        toolbar: false,
        placeholder: 'Write a reply...',
        tabIndex: 0,
        height: 'auto',
        minHeight: 80,
        readonly: writing,
        events: {
            keydown: (e) => {setKey(e.keyCode); setChar(e.key);},
            input: (e) => e.preventDefault()
        }
    });

    useEffect(() => {
        let newArr = [{ label: props.content.creator.name, id: props.content.creator.id, src: "comment"}];

        if(replies && replies.length > 0){
            for(let r of replies){
                if(r.creator.id !== newArr[0].id){
                    const exist = newArr.findIndex(u => {
                        return u.id == r.creator.id;
                    });
    
                    if(exist === -1){
                        newArr.push({
                            label: r.creator.name,
                            id: r.creator.id,
                            src: "reply"
                        });
                    }else{
                        newArr[exist] = {...newArr[exist], src: "reply"};
                    }
                }

                // Get from existing tags in comments
                var EditorsParser = new DOMParser();
                var descriptionHTML = EditorsParser.parseFromString(r.body, 'text/html');
            
                for(let mention of descriptionHTML.getElementsByClassName("user_mention_editor router")){
                    if(mention.getAttribute("data-mention-id") !== newArr[0].id && mention.getAttribute("data-mention-id") !== "-5" && mention.getAttribute("data-mention-id") !== "-2" && mention.getAttribute("data-mention-id") !== "-1"){
                        const exist = newArr.findIndex(u => {
                            return u.id == mention.getAttribute("data-mention-id");
                        });
        
                        if(exist === -1){
                            newArr.push({
                                label: mention.innerHTML.replace('@',''),
                                id: mention.getAttribute("data-mention-id"),
                                src: "tag"
                            });
                        }
                    }
                }
            }
        }

        props.subscribers.forEach((s) => {
            const exist = newArr.findIndex(u => {
                return u.id == s.id;
            });

            if(exist === -1){
                newArr.push({
                    label: s.name,
                    id: s.id,
                    src: "sub"
                });
            }else{
                if(newArr[exist].src === "tag"){
                    newArr[exist] = {...newArr[exist], src: "sub"};
                }
            }
        });

        newArr.push({ label: 'Everyone on this item', id: -5 });

        setTags(newArr);
    }, [replies]);

    const writeToMonday = async (mondayInterface, query, variables, errorType, retry) => {
        let result;
        try {
            result = await mondayInterface.api(query, { variables: variables });
        } catch (error) {
            console.log(`Error creating ${errorType}: `, error);
            if(retry > 0){
                console.log("Retrying in 3 sec...");
                props.monday.execute("notice", { 
                    message: `Error creating ${errorType}, retrying in 5 sec...`,
                    type: "error", // or "error" (red), or "info" (blue)
                    timeout: 3000,
                });
                await new Promise(r => setTimeout(r, 5000));
                return await writeToMonday(mondayInterface, query, variables, errorType, retry-1);
            }
            return -1;
        }
        return result;
    }

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

    const getSearchCandidate = () => {
        let filtered = [];
        atUsers.forEach((user) => {
            if(user.label.toLowerCase().startsWith(tagSearchRef.current.toLowerCase())){
                filtered.push(user);
            }
        });

        return filtered[0];
    }

    const parseReply = (newText, selectCandidate) => {
        if(isTagSearchRef.current){
            if(lastKey === 13 || selectCandidate){
                const f = document.getElementById(props.content.id);
                const e = f.getElementsByClassName("jodit-wysiwyg");
                var range = document.createRange();

                toggleTagSearch(false);
                setSelectorStyle((prev) => ({...prev, display: 'none'}));

                // Replace from dropdown
                const candidate = selectCandidate || getSearchCandidate();
                let futureEnd = tagSearchEnd;

                if(candidate){
                    const beforeAt = newText.substring(0, tagSearchInit);
                    const postAt = newText.substring(tagSearchEnd+1).replace('<p>','').replace('<br>','').replace('</p>','');

                    const tag = "@"+candidate.label;
                    let incDiff = tag.length - tagSearch.length;
                    futureEnd += incDiff;
                    setTagSearchEnd(futureEnd);
                    const replacement = `<a class="user_mention_editor router" href="https://${props.slug}.monday.com/users/${candidate.id}" data-mention-type="user" data-mention-id="${candidate.id}" target="_blank" rel="noopener noreferrer">${tag}</a>`;
                    newText = beforeAt+replacement+'&nbsp;'+postAt;
                }

                setKey(-1);
                setReply(newText);
                setTagSearch('');

                var sel = window.getSelection();
                let lineBreaks = (newText.substring(0, tagSearchInit).match(/(<p>)/g) || []).length-1;
                
                toggleTagSearch(false);

                setTimeout(() => {
                    let tempText = newText.substring(0, futureEnd);
                    for(let i=0; i < lineBreaks; i++){
                        tempText = tempText.substring(e[0].childNodes[i].outerHTML.length);
                    }
                    
                    let preTags = (tempText.substring(0, futureEnd).match(/<a/g) || []).length;

                    let target = 0;
                    for(let elem of e[0].childNodes[lineBreaks].childNodes){
                        if(elem.nodeType === Node.ELEMENT_NODE && elem.nodeName == "A"){
                            preTags--;
                        }
                        if(preTags == 0){
                            break;
                        }
                        target++;
                    }

                    range.setStart(e[0].childNodes[lineBreaks], target+1);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    setTagSearch('');                    
                }, 0);

                return;
            }

            if(newText[tagSearchInit] !== "@"){
                toggleTagSearch(false);
                setTagSearch('');
                setSelectorStyle((prev) => ({...prev, display: 'none'}));
                setReply(newText);
                return;
            }

            if(newText.length < newReply.length){
                const diff = newReply.length - newText.length;
                
                setTagSearch(newText.substring(tagSearchInit+1, tagSearchEnd-diff));
                
                setTagSearchEnd((prev) => (prev-diff));
            }else{
                let endPosition = -1;
                for(let i = tagSearchInit; i<newText.length;i++){
                    if(newText[i] !== newReply[i]){
                        if(newText[i] === lastChar){
                            endPosition = i;
                            setTagSearchEnd(endPosition);
                            break;
                        }
                    }
                }
                setTagSearch(newText.substring(tagSearchInit+1, endPosition));
            }
            setReply(newText);
        }else{
            let atPosition = -1;

            if(lastChar == "@"){
                for(let i = 0; i<newText.length;i++){
                    if(newText[i] !== newReply[i]){
                        if(newText[i] === lastChar){
                            atPosition = i;
                            break;
                        }
                    }
                }
            }else{
                for(let i = 0; i<newText.length;i++){
                    if(newText[i] !== newReply[i]){
                        if(newText[i] === lastChar){
                            break;
                        }
                    }
                }
            }

            if(atPosition !== -1){
                if(!/[a-zA-Z0-9]/.test(newText[atPosition-1])){
                    toggleTagSearch(true);
                    setTagSearchInit(atPosition);
                    setTagSearchEnd(atPosition);

                    let lineBreaks = (newText.substring(0, atPosition).match(/<p>/g) || []).length+1;
                    if(lineBreaks > 16) lineBreaks = 16;
                    const beforeJumps = lineBreaks*20;
                    
                    const leftPos = window.getSelection().anchorOffset*6.5;
                    setSelectorStyle((prev) => ({...prev, display: 'block', top: (beforeJumps)+'px', left: (70+leftPos)+'px'}));
                }
            }

            setReply(newText);
        }
    }

    const replyEditor = <JoditEditor
                            ref={editorRef}
                            config={config}
                            value={newReply}
                            onBlur={hideEditor}
                            onChange={(value) => parseReply(value)}
                            />;

    const sendReply = async () => {
        setWriting(true);
        
        var EditorsParser = new DOMParser();
        var descriptionHTML = EditorsParser.parseFromString(newReply, 'text/html');
        var pendingNotifications = [];

        // Extract pending notifications
        let everyoneNotificationFlag = false;
        for(let mention of descriptionHTML.getElementsByClassName("user_mention_editor router")){
            if(mention.getAttribute("data-mention-id") === "-5"){
                everyoneNotificationFlag = true;
                atUsers.forEach((s) => {
                    if(s.src === "sub"){
                        pendingNotifications.push({
                            id: s.id,
                            type: `"Everyone on ${props.name}"`,
                            src: s.src,
                            subtype: "everyone"
                        });
                    }
                });
            }else{
                // Should be notified manually?
                const userTarget = atUsers.findIndex( u => { return u.id == mention.getAttribute("data-mention-id"); });
                if(userTarget !== -1 && (atUsers[userTarget].src == "tag" || atUsers[userTarget].src == "sub")){
                    pendingNotifications.push({
                        id: mention.getAttribute("data-mention-id"),
                        type: `You`,
                        src: atUsers[userTarget].src,
                        subtype: "tag"
                    });
                }
            }
        }

        if(everyoneNotificationFlag){
            let filtered = [];
            pendingNotifications.forEach((user) => {
                if((user.subtype === "tag" && user.src === "tag") || user.subtype == "everyone"){
                    filtered.push(user);
                }
            });
            pendingNotifications = filtered;
        }

        if(descriptionHTML.getElementsByTagName('img').length > 0){
            if(props.photoAux !== -1){
                for(let picture of descriptionHTML.getElementsByTagName('img')){
                    if(picture.src.substring(0,4) === "data"){
                        // Upload the base64 picture to dummy 
                        let query = `mutation ($update: Int!, $file: File!) {
                            add_file_to_update (update_id: $update, file: $file) {
                                id
                                url
                            }
                        }`;
                        let variables = { update: parseInt(props.photoAux), file: picture.src };
        
                        const tempResult = await writeToMonday(props.monday, query, variables, 'update', 5);
                    
                        if(tempResult === -1){
                            props.monday.execute("notice", { 
                                message: `Error while creating update, try again later or create it manually`,
                                type: "error", // or "error" (red), or "info" (blue)
                                timeout: 10000,
                            });
                            setWriting(false);
                            return;
                        }
        
                        const fileReference = tempResult.data.add_file_to_update;
                        picture.src = fileReference.url;
                    }
                    picture.className = "post_image_group"
                }
            }else{
                props.monday.execute("notice", { 
                    message: `Error adding reply, this update was not created with TSE-Helper, please add your reply manually or remove the pictures`,
                    type: "error", // or "error" (red), or "info" (blue)
                    timeout: 10000,
                });
                setWriting(false);
                return;
            }
        }

        const query = `mutation ($item: Int!, $parent: Int, $body: String!) {
            create_update(item_id: $item, parent_id: $parent, body: $body){
                id
                creator {
                    name
                    photo_small
                }
                created_at
                body
            }
        }`;

        const variables = {
            item: parseInt(props.itemID),
            parent: parseInt(props.updateID),
            body: descriptionHTML.body.innerHTML.toString().replaceAll('<p></p>','')
        };

        const tempResult = await writeToMonday(props.monday, query, variables, 'reply', 5);
                
        if(tempResult === -1){
            props.monday.execute("notice", { 
                message: `Error while creating update, try again later or create it manually`,
                type: "error",
                timeout: 10000,
            });
            setWriting(false);
            return;
        }else{
            setReplies((prev) => [...prev, tempResult.data.create_update]);
            setReply('');

            // Send Notifications
            for(let n of pendingNotifications){
                const query = `mutation ($user: Int!, $target: Int!, $text: String!) {
                    create_notification(user_id: $user, target_id: $target, text: $text, target_type: Post){
                        text
                    }
                }`;
        
                const variables = {
                    user: parseInt(n.id),
                    target: parseInt(props.updateID),
                    text: `<span style="color: #69a7ef;">@ Mentioned</span> ${n.type} in a reply "${descriptionHTML.body.textContent.substring(0, 71)}${descriptionHTML.body.textContent.length > 70 ? '...':''}"`
                };
        
                const tempResult = await writeToMonday(props.monday, query, variables, 'notification', 2);
            }

            setWriting(false);
        }
    }    


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
    }

    return (
        <div className='Update'>
            <div className='UpdateHeader'>
                <div className='title'>
                    <div>
                        <img src={props.content.creator.photo_small} className='update_profile_icon' alt={props.content && props.content.creator.name}/>
                    </div>
                    <div className='name'>
                        {
                            props.content && props.content.creator.name
                        }
                    </div>
                    <div style={{color: '#9699a6', fontSize: '13px'}}>
                        {timeAgo.format(new Date(props.content.created_at))}
                    </div>
                </div>
            </div>
            <div ref={updateContent} className='update_content' />
            {
                props.content && props.content.body.length > 500 ? (
                    <div className='update_content_read_more'><Button onClick={expandUpdate} className='btn-readmore' size={Button.sizes.SMALL}>Read More &nbsp;<img src={DropdownChevronDown} style={{pointerEvents: 'none'}} alt='Read More'/></Button></div>
                ):''
            }
            <div className='update_replies'>
                <div>
                    {
                        replies.map((reply) => {
                            return <Reply key={reply.id} content={reply} />
                        })
                    }
                </div>
            </div>
            <div className='p-relative p-2'>
                <img src={props.photo} className='new_reply_profile' alt='Me' />
                <div onClick={showEditor} id={props.content.id} className={showingEditor?'reply_preview_container_opened':'reply_preview_container_closed'}>
                    <style>
                        {`.jodit-status-bar { display: none; }
                        .jodit-add-new-line_after { display: none }
                        .jodit-wysiwyg p { margin-top: 0px; margin-bottom: 5px; }`}
                    </style>
                    { replyEditor }
                </div>
                <div style={tagSelectorStyle}>
                    <Select
                        isSearchable
                        defaultMenuIsOpen={true}
                        inputValue={tagSearch}
                        onInputChange= {setTagSearch}
                        onChange={(value) => { parseReply(newReply, value); }}
                        options={atUsers} />
                </div>
                <div className={showingEditor?'d-flex mt-1 jf-end':'d-none mt-1 jf-end'}>
                    <Button onClick={sendReply} size={Button.sizes.SMALL} loading={writing}>Reply</Button>
                </div>
            </div>
        </div>
    );
}

export default Update;