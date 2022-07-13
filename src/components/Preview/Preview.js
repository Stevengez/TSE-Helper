import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Update from './Update';

const Preview = (props) => {

    const params = new URLSearchParams(window.location.search);
    const itemID = params.has('itemId') ? parseInt(params.get('itemId')):0;
    const [mePhoto, setMePhoto] = useState('');
    const [itemName, setName] = useState('...');
    const [updates, setUpdates] = useState();

    const reOrder = (updates) => {
        
        if(updates && updates.length > 0){
            let candidate = updates[0];
            let cdtIdx = 0;
            
            updates.forEach((update, index) => {
                if(update.replies.length > candidate.replies.length || candidate.creator.name == 'Automations'){
                    candidate = update;
                    cdtIdx = index;
                }
            });
            
            updates.splice(cdtIdx, 1);
            updates.unshift(candidate);
            return updates;
        }else{
            return updates;
        }
    }

    useEffect(() => {
        console.log("Preview of: ", itemID);

        if(props.settings){
            console.log("Here they are: ", props.settings);
            let minterface = props.monday;
            if(props.settings.externaldow){
                console.log("Api: ", props.settings.apitoken);
                console.log('Live: will use external interface');
                minterface = props.remoteMonday;
            }else{
                console.log("Will not use external interface");
            }
            
            console.log("Asking for: ", parseInt(itemID));
            minterface.api(`query ($item: [Int]) {
                me {
                    photo_small
                    account {
                        slug
                    }
                }
                items(ids: $item){
                    name
                    updates{
                        id
                        creator {
                            name
                            photo_small
                        }
                        body
                        replies {
                            id
                            creator {
                                name
                                photo_small
                            }
                            body
                        }
                    }
                }
            }`, { variables: {
                item: parseInt(itemID)
            }}).then(res => {
                
                setMePhoto(res.data.me.photo_small);
                const items = res.data.items;

                console.log("Result: ", res.data);
                console.log("Result: ", res.data.me.account);

                if(items.length > 0){
                    const item = items[0];
                    const updates = reOrder(item.updates);
                    setName(item.name);

                    setUpdates(updates);
                    
                }else{
                    props.monday.execute('closeAppFeatureModal');
                    props.monday.execute("notice", { 
                        message: `Item [${itemID}] not found.`,
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 4000,
                    });
                }
            });
        }
    },[itemID, props.settings]);

    return <>
        <div>
            <div className='Container bg-white px-1'>
                <h3>{itemName}</h3>
            </div>
            <div className='UpdateContainer bg-white tx-black p-1 mt-1 noscroll'>
                {
                    updates && updates.map((update) => {
                        console.log("This id: ", update.id);
                        return <Update key={update.id} className='mt-1' content={update} photo={mePhoto} />;
                    })
                }
            </div>
        </div>
    </>;
}

export default Preview;