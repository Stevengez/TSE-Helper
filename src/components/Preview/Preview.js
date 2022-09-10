import React, { useEffect, useState } from 'react';
import { Dropdown, Label } from "monday-ui-react-core";
import Update from './Update';
import { getByText } from '@testing-library/react';

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
const SeverityOptions = [
{
    label: 'Please add Severity',
    value: 'Please add Severity'
},
{
    label: 'High',
    value: 'High'
},
{
    label: 'Medium',
    value: 'Medium'
},
{
    label: 'Low',
    value: 'Low'
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
    const [localItemId, setLocalID] = useState("-1");
    const [itemName, setItemName] = useState('');
    const [mePhoto, setMePhoto] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const [updates, setUpdates] = useState();
    const [photoUpdate, setPhotoAux] = useState(-1);

    const [liveStatus, setStatus] = useState();
    const [liveLogin, setLogin] = useState();
    const [liveReplicable, setReplicable] = useState();
    const [liveSeverity, setPriority] = useState();
    const { settings, context, monday, remoteMonday, setName } = props;

    const writeToMonday = async (mondayInterface, query, variables, errorType, retry) => {
        let result;
        try {
            result = await mondayInterface.api(query, { variables: variables });
        } catch (error) {

            console.log(`Error ${errorType}: `, error);
            if(retry > 0){
                console.log("Retrying in 3 sec...");
                props.monday.execute("notice", { 
                    message: `Error ${errorType}, retrying in 5 sec...`,
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

    const updateStatus = (columnId, newLabel, targetInterface, boardID, litemID, notNotify) => {

        // console.log("Updating Status Start....");

        let minterface = props.monday;
        if(props.settings.externaldow){
            minterface = props.remoteMonday;
        }

        minterface = targetInterface || minterface;

        let jsonValue = { label: newLabel };

        let query = `mutation ($board: Int!, $item: Int!, $column: String!, $value: JSON!){
            change_column_value (board_id: $board, item_id: $item, column_id: $column, value: $value) {
                id
            }
        }`;

        // console.log("board is: ", boardID, "item is: ", litemID);
        // console.log("special parse board: ",parseInt(boardID || settings.dowID));
        // console.log("special parse itemID: ",parseInt(litemID || itemID));

        let variables = {
            board: parseInt(boardID || settings.dowID),
            item: parseInt(litemID || itemID),
            column: columnId,
            value: JSON.stringify(jsonValue)
        };

        const result = writeToMonday(minterface, query, variables, 'updating status', 5);

        if(result === -1){
            props.monday.execute("notice", { 
                message: `Error updating status, please try again later`,
                type: "error",
                timeout: 3000,
            });
        }else{
            if(boardID && litemID){
                if(!notNotify){
                    props.monday.execute("notice", { 
                        message: `Local status sync`,
                        type: "info",
                        timeout: 1000,
                    });
                }
            }else{
                props.monday.execute("notice", { 
                    message: `Status updated`,
                    type: "success",
                    timeout: 1500,
                });

                if(localItemId !== "-1"){
                    settings.helperdowitemid = {
                        text4: true
                    }

                    settings.helperdowstatus = {
                        status_19: true
                    }

                    if(columnId === props.settings.dowstatus){
                        updateStatus(Object.keys(settings.helperdowstatus)[0], newLabel, monday, context.boardIds[0], localItemId, true);
                    }
                }
            }
        }
    }

    const reOrder = (updates) => {
        if(updates && updates.length > 0){
            let candidate = updates[0];
            let cdtIdx = 0;

            var EditorsParser = new DOMParser();
            var auxFound = false;
            
            updates.forEach((update, index) => {
                if(update.replies.length > candidate.replies.length || candidate.creator.name === 'Automations'){
                    candidate = update;
                    cdtIdx = index;
                }

                if(!auxFound){
                    var descriptionHTML = EditorsParser.parseFromString(update.body, 'text/html');
                    const pTags = descriptionHTML.getElementsByTagName("p");

                    if(pTags.length > 0){
                        if(pTags[0].style.display === "none"){
                            if(pTags[0].innerText === "#TSE_HELPER#"){
                                auxFound = true;
                                setPhotoAux(update.id);
                            }
                        }
                    }
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
        if(settings){
            let minterface = monday;
            if(settings.externaldow){
                minterface = remoteMonday;
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
                    subscribers {
                        id
                        name
                    }
                    updates{
                        id
                        created_at
                        creator {
                            id
                            name
                            photo_small
                        }
                        body
                        replies {
                            id
                            creator {
                                id
                                name
                                photo_small
                            }
                            body
                            created_at
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
                    setName(item.name);setItemName(item.name);
                    setSubscribers(item.subscribers);
                    setStatus(getSelector(item.column_values, settings.dowstatus));
                    setLogin(getSelector(item.column_values, settings.dowlogin));
                    setReplicable(getSelector(item.column_values, settings.dowreproducible));
                    setPriority(getSelector(item.column_values, settings.dowpriority));
                    setUpdates(updates);

                    settings.helperdowitemid = {
                        text4: true
                    }

                    settings.helperdowstatus = {
                        status_19: true
                    }

                    monday.api(`query ($board: Int!, $column: String!, $itemId: String!) {
                        items_by_column_values (board_id: $board, column_id: $column, column_value: $itemId) {
                            id
                            column_values {
                                id
                                value
                                text
                            }
                        }
                    }`, { variables: {
                            board: parseInt(context.boardIds[0]),
                            column: Object.keys(settings.helperdowitemid)[0],
                            itemId: itemID+''
                        }
                    }).then((res) => {
                        if(res.data.items_by_column_values.length > 0){
                            const localItem = res.data.items_by_column_values[0];
                            const remoteItem = item;

                            setLocalID(localItem.id);
                            const localStatus = getText(localItem.column_values, Object.keys(settings.helperdowstatus)[0]);
                            const remoteStatus = getText(remoteItem.column_values, settings.dowstatus);

                            if(localStatus !== remoteStatus){
                                updateStatus(Object.keys(settings.helperdowstatus)[0], remoteStatus, monday, context.boardIds[0], localItem.id);
                            }
                        }else{
                            monday.execute("notice", { 
                                message: `This DoW is not present in your local board`,
                                type: "info", // or "error" (red), or "info" (blue)
                                timeout: 1000,
                            });
                        }
                    });


                }else{
                    monday.execute('closeAppFeatureModal');
                    monday.execute("notice", { 
                        message: `Item [${itemID}] not found.`,
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 4000,
                    });
                }
            });
        }
    },[itemID, context, settings, setName, monday, remoteMonday]);

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
            case 'High':
                return '#F31A1A';
            case 'Medium':
                return '#FFB821';
            case 'Low':
                return '#0AA91B';
            default:
                return '#B8B8B8';
        }
    }

    const getText = (column_values, targetId) => {
        const colIdx = column_values.findIndex((c) => {
          return c.id === targetId;
        });
    
        if(colIdx !== -1){
          return column_values[colIdx].text;
        }else{
          console.log(`${targetId} doesn't exists`);
        }
      }

    return <>
        <div>
            <div className='Container d-col-dir bg-white px-1'>
                <div>
                    <table width='100%' className="p-1" style={{textAlign: 'center'}}>
                        <thead>
                            <tr>
                                <td><strong><small>Status</small></strong></td>
                                <td width='130px'><strong><small>Domain</small></strong></td>
                                <td width='130px'><strong><small>Login</small></strong></td>
                                <td width='130px'><strong><small>Severity</small></strong></td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className='liveColoring' style={{backgroundColor: getColor(liveStatus)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveStatus}
                                        onChange={(value) => { setStatus(value); updateStatus(props.settings.dowstatus,value.value); }}
                                        options={StatusOptions} />
                                    
                                </td>
                                <td className='liveColoring' style={{backgroundColor: getColor(liveReplicable)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveReplicable}
                                        onChange={(value) => { setReplicable(value); updateStatus(props.settings.dowreproducible,value.value);}}
                                        defaultValue={{
                                            label: 'Please fill-in',
                                            value: 'Please fill-in'
                                        }}
                                        options={ReproducibleOptions}/>
                                </td>
                                <td className='liveColoring' style={{backgroundColor: getColor(liveLogin)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveLogin}
                                        onChange={(value) => { setLogin(value); updateStatus(props.settings.dowlogin,value.value);}}
                                        defaultValue={{
                                            label: 'Pending',
                                            value: 'Please fill-in'
                                        }}
                                        options={LoginOptions}/>
                                </td>
                                <td className='liveColoring' style={{backgroundColor: getColor(liveSeverity)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveSeverity}
                                        onChange={(value) => { setPriority(value); updateStatus(props.settings.dowpriority,value.value);}}
                                        defaultValue={{
                                            label: 'Please add Severity',
                                            value: 'Please add Severity'
                                        }}
                                        options={SeverityOptions}/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className='UpdateContainer bg-white tx-black p-1 mt-1 noscroll'>
                {
                    updates && updates.map((update) => {
                        return <Update name={itemName} key={update.id} slug={props.settings.slug} photoAux={photoUpdate} className='mt-1' itemID={itemID} updateID={update.id} content={update} subscribers={subscribers} photo={mePhoto} monday={props.settings.externaldow?props.remoteMonday:props.monday} />;
                    })
                }
            </div>
        </div>
    </>;
}

export default Preview;