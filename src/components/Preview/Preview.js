import React, { useEffect, useState } from 'react';
import { Dropdown, Label } from "monday-ui-react-core";
import Update from './Update';

const StatusOptions = [
    {
        label:"Back to dev",
        value: "Back to dev",
        color: Label.colors.POSITIVE
    },{
        label:"Waiting for client",
        value:"Waiting for client",
        color: Label.colors.NEGATIVE
    },{
        label:"Waiting for reporter",
        value:"Move back to reporter"
    },{
        label:"Done",
        value:"Done"
    },{
        label:"New ticket",
        value:"New ticket"
    },{
        label:"Moved to bugs Q",
        value:"Moved to bugs Q"
    },{
        label:"Duplicate",
        value:"Duplicate"
    },{
        label:"Known limitation",
        value:"Known limitation"
    },{
        label:"Known bug",
        value:"Known bug"
    },{
        label:"New",
        value:"New"
    },{
        label:"w4 Review/Deploy",
        value:"w4 Review/Deploy"
    },{
        label:"Closed with no response",
        value:"Closed with no response"
    },{
        label:"Reviewed by TS",
        value:"Reviewed by TS"
    },{
        label:"Waiting for 3rd party",
        value:"Waiting for 3rd party"
    },{
        label:"Working on it",
        value:"Working on it"
    },{
        label:"Missing Critical Data",
        value:"Missing Critical Data"
    },{
        label:"Waiting for permission to login",
        value:"Waiting for permission to login"
    },{
        label:"Escalated from design",
        value:"Escalated from design"
    }
];
const LoginOptions = [
    {
        label: 'Pending',
        value: 'Pending ⌛'
    },
    {
        label: 'Granted',
        value: 'Granted ✨'
    },
    {
        label: 'Not Granted',
        value: 'Not Granted ⛔'
    },
    {
        label: 'Didn\'t Request',
        value: 'Didn\'t request - let us know if needed'
    }
];
const ReproducibleOptions = [
{
    label: 'Please fill-in',
    value: 'Please fill-in'
},
{
    label: 'Yes',
    value: 'Yeap ✔️'
},
{
    label: 'No',
    value: 'Nope ❌'
}
];
const PriorityOptions = [
{
    label: 'Please fill-in',
    value: 'Please fill-in'
},
{
    label: 'Critical',
    value: 'P0 - CRITICAL'
},
{
    label: 'Urgent',
    value: 'P1 - Urgent'
},
{
    label: 'Important',
    value: 'P2 - Important'
},
{
    label: 'Fix needed',
    value: 'P3 - Fix needed'
},
{
    label: 'Best effort (DONT USE)',
    value: 'P4 - Best effort, DO NOT USE'
}
//,{
//   label: 'Being Reviewed For new Prioritization',
//   value: 'Being Reviewed For new Prioritization'
// },
// {
//   label: 'High',
//   value: 'High'
// },
// {
//   label: 'Open',
//   value: 'Open'
// },
// {
//   label: 'P1',
//   value: 'P1'
// },
// {
//   label: 'Priority 3',
//   value: 'Priority 3'
// }
];

const Preview = (props) => {

    const params = new URLSearchParams(window.location.search);
    const itemID = params.has('itemId') ? parseInt(params.get('itemId')):0;
    const [mePhoto, setMePhoto] = useState('');
    const [itemName, setName] = useState('...');
    const [updates, setUpdates] = useState();

    const [liveStatus, setStatus] = useState();
    const [liveLogin, setLogin] = useState();
    const [liveReplicable, setReplicable] = useState();
    const [livePriority, setPriority] = useState();

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
        if(props.settings){
            let minterface = props.monday;
            if(props.settings.externaldow){
                minterface = props.remoteMonday;
            }
            
            minterface.api(`query ($item: [Int], $columns: [String]) {
                me {
                    photo_small
                    account {
                        slug
                    }
                }
                items(ids: $item){
                    name
                    column_values(ids: $columns) {
                        id
                        value
                        text
                    }
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
                item: parseInt(itemID),
                columns: [props.settings.dowstatus, props.settings.dowlogin, props.settings.dowreproducible, props.settings.dowpriority]
            }}).then(res => {
                
                setMePhoto(res.data.me.photo_small);
                const items = res.data.items;

                if(items.length > 0){
                    const item = items[0];
                    const updates = reOrder(item.updates);
                    props.setName(item.name);
                    setStatus(getSelector(item.column_values, props.settings.dowstatus));
                    setLogin(getSelector(item.column_values, props.settings.dowlogin));
                    setReplicable(getSelector(item.column_values, props.settings.dowreproducible));
                    setPriority(getSelector(item.column_values, props.settings.dowpriority));
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

    const getSelector = (column_values, targetId) => {
        const colIdx = column_values.findIndex((c) => {
            return c.id === targetId;
        });

        if(colIdx !== -1){
            return { label: column_values[colIdx].text, value: column_values[colIdx].text};
        }else{
            console.log(`${targetId} doesn't exists`);
        }
    }

    const getColor = (selection) => {
        if(!selection) return 'gray';
        switch(selection.value){
            case "Back to dev":
                return '#6E9BFF';
            case "Waiting for client":
                return '#FB8CFF';
            case "Move back to reporter":
                return '#A707AC';
            case "Done":
                return '#0AA91B';
            case "New ticket":
                return '#9E9E9E';
            case "Moved to bugs Q":
                return '#4C8EB0';
            case "Duplicate":
                return '#F95D1B';
            case "Known limitation":
                return '#83E7F3';
            case "Known bug":
                return '#0EB2E2';
            case "New":
                return '#C7F2FF';
            case "w4 Review/Deploy":
                return '#A9E411';
            case "Closed with no response":
                return '#4300AE';
            case "Reviewed by TS":
                return '#21A000';
            case "Waiting for 3rd party":
                return '#DFC95E';
            case "Working on it":
                return '#FFB821';
            case "Missing Critical Data":
                return '#F31A1A';
            case "Waiting for permission to login":
                return '#FFA99D';
            case "Escalated from design":
                return '#E33B7A';
            case 'Pending ⌛':
                return '#C7F2FF';
            case 'Granted ✨':
                return '#A9E411';
            case 'Not Granted ⛔':
                return '#F31A1A';
            case 'Didn\'t request - let us know if needed':
                return '#FFB821';
            case 'Yeap ✔️':
                return '#4C8EB0';
            case 'Nope ❌':
                return '#DFC95E';
            case 'P0 - CRITICAL':
                return '#F31A1A';
            case 'P1 - Urgent':
                return '#FFB821';
            case 'P2 - Important':
                return '#0EB2E2';
            case 'P3 - Fix needed':
                return '#0AA91B';
            case 'P4 - Best effort, DO NOT USE':
                return '#383B41';
            default:
                return '#B8B8B8';
        }
    }

    return <>
        <div>
            <div className='Container d-col-dir bg-white px-1'>
                <div>
                    <table width='100%' className="p-1" style={{textAlign: 'center'}}>
                        <tr>
                            <td><strong><small>Status</small></strong></td>
                            <td width='130px'><strong><small>Login</small></strong></td>
                            <td width='130px'><strong><small>Replicable</small></strong></td>
                            <td width='130px'><strong><small>Priority</small></strong></td>
                        </tr>
                        <tr>
                            <td className='liveColoring' style={{backgroundColor: getColor(liveStatus)}}>
                                <Dropdown
                                    className="dropdown-stories-styles_spacing mt-1"
                                    size={Dropdown.size.SMALL}
                                    searchable={false}
                                    clearable={false}
                                    value={liveStatus}
                                    onChange={(value) => { setStatus(value); }}
                                    options={StatusOptions} />
                                
                            </td>
                            <td className='liveColoring' style={{backgroundColor: getColor(liveLogin)}}>
                                <Dropdown
                                    className="dropdown-stories-styles_spacing mt-1"
                                    size={Dropdown.size.SMALL}
                                    searchable={false}
                                    clearable={false}
                                    value={liveLogin}
                                    onChange={(value) => { setLogin(value);}}
                                    defaultValue={{
                                        label: 'Pending',
                                        value: 'Please fill-in'
                                    }}
                                    options={LoginOptions}/>
                            </td>
                            <td className='liveColoring' style={{backgroundColor: getColor(liveReplicable)}}>
                                <Dropdown
                                    className="dropdown-stories-styles_spacing mt-1"
                                    size={Dropdown.size.SMALL}
                                    searchable={false}
                                    clearable={false}
                                    value={liveReplicable}
                                    onChange={(value) => { setReplicable(value)}}
                                    defaultValue={{
                                        label: 'Please fill-in',
                                        value: 'Please fill-in'
                                    }}
                                    options={ReproducibleOptions}/>
                            </td>
                            <td className='liveColoring' style={{backgroundColor: getColor(livePriority)}}>
                                <Dropdown
                                    className="dropdown-stories-styles_spacing mt-1"
                                    size={Dropdown.size.SMALL}
                                    searchable={false}
                                    clearable={false}
                                    value={livePriority}
                                    onChange={(value) => { setPriority(value)}}
                                    defaultValue={{
                                        label: 'Please fill-in',
                                        value: 'Please fill-in'
                                    }}
                                    options={PriorityOptions}/>
                            </td>
                        </tr>
                    </table>
                </div>
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