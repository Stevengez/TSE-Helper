import React, { useEffect, useState } from 'react';
import { Dropdown, TextField } from "monday-ui-react-core";
import Update from './Update';
import { useRef } from 'react';

const StatusOptions = [
    {
        label:"Dev Handling",
        value: "Dev Handling"
    },{
        label:"TSS Handling",
        value:"TSS Handling"
    },{
        label:"Move back to reporter",
        value:"Move back to reporter"
    },{
        label:"New ticket",
        value:"New ticket"
    },{
        label:"Move back to client",
        value:"Move back to client"
    },{
        label:"Done",
        value:"Done"
    }
    // ,{
    //     label:"Moved to bugs Q",
    //     value:"Moved to bugs Q"
    // }
    // ,{
    //     label:"Duplicate",
    //     value:"Duplicate"
    // }
    // ,{
    //     label:"Known limitation",
    //     value:"Known limitation"
    // }
    // ,{
    //     label:"Known bug",
    //     value:"Known bug"
    // }
    // ,{
    //     label:"Closed due no response",
    //     value:"Closed due no response"
    // }
    // ,{
    //     label:"Working on it",
    //     value:"Working on it"
    // }
    // ,{
    //     label:"Waiting for permission to login",
    //     value:"Waiting for permission to login"
    // }
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
        label: 'P1 - Critical',
        value: 'P1 - Critical'
    },{
        label: 'P2 - High',
        value: 'P2 - High'
    },{
        label: 'P3 - Fix needed',
        value: 'P3 - Fix needed'
    },{
        label: 'Need to Prioritze',
        value: 'Need to Prioritze'
    }
];
const TypeOptions = [
    {
        label: 'Bug',
        value: 'Bug'
    },{
        label: 'Security Bug',
        value: 'Security Bug'
    },{
        label: 'Product unclear',
        value: 'Product unclear'
    },{
        label: "User's misconfiguration",
        value: "User's misconfiguration"
    },{
        label: "Users's request",
        value: "Users's request"
    },{
        label: 'Performance',
        value: 'Performance'
    },{
        label: 'Closed w/No Response',
        value: 'Closed w/No Response'
    },{
        label: 'Question',
        value: 'Question'
    },{
        label: 'Other',
        value: 'Other'
    },{
        label: 'Existing Bug',
        value: 'Existing Bug'
    },{
        label: 'CS Request',
        value: 'CS Request'
    },{
        label: 'Cheese',
        value: 'Cheese'
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
const DomainOptions = [
    {
        label: 'Apps & API',
        value: 'Apps & API'
    },{
        label: 'Autopilot',
        value: 'Autopilot'
    },{
        label: 'Linkage',
        value: 'Linkage'
    },{
        label: 'Boards Core',
        value: 'Boards Core'
    },{
        label: 'Client Foundations',
        value: 'Client Foundations'
    },{
        label: 'Account Organization',
        value: 'Account Organization'
    },{
        label: 'Users & Governance',
        value: 'Users & Governance'
    },{
        label: 'Growth',
        value: 'Growth'
    },{
        label: 'Insights',
        value: 'Insights'
    },{
        label: 'Monetization',
        value: 'Monetization'
    },{
        label: 'Billing- Do not use',
        value: 'Billing- Do not use'
    },{
        label: 'People & Interactions',
        value: 'People & Interactions'
    },{
        label: 'Server Foundations',
        value: 'Server Foundations'
    },{
        label: 'Cross Domain',
        value: 'Cross Domain'
    },{
        label: 'CRM',
        value: 'CRM'
    },{
        label: 'Desktop App',
        value: 'Desktop App'
    },{
        label: 'Docs',
        value: 'Docs'
    },{
        label: 'Marketing Cluster',
        value: 'Marketing Cluster'
    },{
        label: 'Authorization',
        value: 'Authorization'
    },{
        label: 'Projects Cluster',
        value: 'Projects Cluster'
    },{
        label: 'Software Cluster',
        value: 'Software Cluster'
    },{
        label: 'Strategic Connections',
        value: 'Strategic Connections'
    }
];

const Preview = (props) => {

    const params = new URLSearchParams(window.location.search);
    const itemID = params.has('itemId') ? parseInt(params.get('itemId')):0;
    const [localItemId, setLocalID] = useState("-1");
    const [itemName, setItemName] = useState('Loading...');
    const [mePhoto, setMePhoto] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const [updates, setUpdates] = useState();
    const [photoUpdate, setPhotoAux] = useState(-1);

    const [extendedPreview, toggleExtendedPreview] = useState(false);
    const [liveStatus, setStatus] = useState();
    const [liveLogin, setLogin] = useState();
    const [liveReplicable, setReplicable] = useState();
    const [liveDomain, setDomain] = useState();
    const [liveSeverity, setSeverity] = useState();

    const [liveBB, setBB] = useState();
    const [liveZDTicket, setTicketID] = useState();
    const [livePriority, setPriority] = useState();
    const [liveType, setType] = useState();

    const typingTimer1 = useRef();
    const typingTimer2 = useRef();

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

    const updateText = (columnId, newText) => {
        let minterface = props.monday;

        if(props.settings.externaldow){
            minterface = props.remoteMonday;
        }

        let query = `mutation ($board: Int!, $item: Int!, $column: String!, $value: String!){
            change_simple_column_value (board_id: $board, item_id: $item, column_id: $column, value: $value) {
                id
            }
        }`;

        let variables = {
            board: parseInt(settings.dowID),
            item: parseInt(itemID),
            column: columnId,
            value: newText
        };

        const result = writeToMonday(minterface, query, variables, 'updating text', 2);

        if(result === -1){
            props.monday.execute("notice", { 
                message: `Error updating column, please try again later`,
                type: "error",
                timeout: 3000,
            });
        }else{
            props.monday.execute("notice", { 
                message: `Column updated`,
                type: "success",
                timeout: 1500,
            });
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
                columns: [props.settings.dowstatus, props.settings.dowlogin, props.settings.dowreproducible, props.settings.dowpriority, props.settings.dowbb, props.settings.dowzdticket, props.settings.dowseverity, props.settings.dowdomain, props.settings.dowtype]
            }}).then(res => {
                
                setMePhoto(res.data.me.photo_small);
                const items = res.data.items;

                if(items.length > 0){
                    const item = items[0];
                    const updates = reOrder(item.updates);
                    setName(item.name);setItemName(item.name);
                    setSubscribers(item.subscribers);
                    setStatus(getSelector(item.column_values, settings.dowstatus));
                    setDomain(getSelector(item.column_values, settings.dowdomain));
                    setLogin(getSelector(item.column_values, settings.dowlogin));
                    setSeverity(getSelector(item.column_values, settings.dowseverity));

                    setPriority(getSelector(item.column_values, settings.dowpriority));
                    setType(getSelector(item.column_values, settings.dowtype));
                    setBB(getSelector(item.column_values, settings.dowbb).value);
                    setTicketID(getSelector(item.column_values, settings.dowzdticket).value);
                    
                    setUpdates(updates);

                    // settings.helperdowitemid = {
                    //     text4: true
                    // }

                    // settings.helperdowstatus = {
                    //     status_19: true
                    // }

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
            case "Dev Handling":
            case "Back to dev":
                return '#79affd';
            case "Move back to client":
                return '#ff44a1';
            case "Move back to reporter":
                return '#b57de3';
            case "Done":
                return '#33d391';
            case "New ticket":
                return '#797e93';
            case "Moved to bugs Q":
            case "TSS Handling":
                return '#4C8EB0';
            case "Duplicate":
                return '#ff8358';
            case "Known limitation":
                return '#71d6d1';
            case "Known bug":
                return '#339ecd';
            case "Closed due no response":
            case "Closed w/No Response":
                return '#777ae5';
            case "Working on it":
                return '#ffd533';
            case "Waiting for permission to login":
            case 'Existing Bug':
                return '#ff9191';
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
            case 'P1 - Critical':
                return '#F31A1A';
            case 'Medium':
            case 'P2 - High':
                return '#FFB821';
            case 'Low':
            case 'P3 - Fix needed':
                return '#0AA91B';
            //Domains
            case 'Apps & API':
                return '#ffd533';
            case 'Autopilot':
                return '#79affd';
            case 'Linkage':
            case 'Cheese':
                return '#e8697d';
            case 'Boards Core':
                return '#d5c567';
            case 'Client Foundations':
            case 'Question':
                return '#33d391';
            case 'Account Organization':
            case 'Product unclear':
                return '#85d6ff';
            case 'Users & Governance':
            case "Users's request":
                return '#b0dc51';
            case 'Growth':
                return '#fbb4f4';
            case 'Insights':
            case 'Security Bug':
                return '#359970';
            case 'Monetization':
                return '#936fda';
            case 'Billing- Do not use':
            case 'Performance':
                return '#9862a1';
            case 'People & Interactions':
                return '#ff7bd0';
            case 'Server Foundations':
                return '#99756c';
            case 'Cross Domain':
                return '#ff8358';
            case 'CRM':
                return '#175a63';
            case 'Desktop App':
            case 'CS Request':
                return '#339ecd';
            case 'Docs':
                return '#71d6d1';
            case 'Marketing Cluster':
                return '#a1e3f6';
            case 'Authorization':
            case 'Bug':
                return '#ff44a1';
            case 'Projects Cluster':
                return '#2b76e5';
            case 'Software Cluster':
                return '#fdbc64';
            case 'Strategic Connections':
                return '#ffbdbd';
            //Type
            case "User's misconfiguration":
                return '#5c5c5c';
            default:
                return '#B8B8B8';
        }
    }

    const getText = (column_values, targetId) => {
        const colIdx = column_values.findIndex((c) => {
            return c.id === targetId;
        });
    
        if(colIdx !== -1){
            //console.log("searching text for: ", colIdx, " - ", targetId, " = ", column_values[colIdx].text);
            return column_values[colIdx].text;
        }else{
            console.log(`${targetId} doesn't exists`);
        }
    }

    const listenTimer1 = (columnID, newValue) => {
        clearTimeout(typingTimer1.current);
        typingTimer1.current = setTimeout(() => updateText(columnID, newValue), 1500);
    }

    const listenTimer2 = (columnID, newValue) => {
        clearTimeout(typingTimer2.current);
        typingTimer2.current = setTimeout(() => updateText(columnID, newValue), 1500);
    }

    return <>
        <div style={{display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'auto'}}>
            <div>
                <div>
                    <h2 className='tx-white'>{itemName.length > 45 ? itemName.substring(0,45)+'...':itemName}</h2>
                </div>
                <div className='Container d-col-dir bg-white px-1'>
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
                                <td className='liveColoring' style={{backgroundColor: getColor(liveDomain)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveDomain}
                                        onChange={(value) => { setDomain(value); updateStatus(props.settings.dowdomain,value.value);}}
                                        defaultValue={{
                                            label: 'Select a Domain',
                                            value: ''
                                        }}
                                        options={DomainOptions}/>
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
                                        onChange={(value) => { setSeverity(value); updateStatus(props.settings.dowseverity,value.value);}}
                                        defaultValue={{
                                            label: 'Please add Severity',
                                            value: 'Please add Severity'
                                        }}
                                        options={SeverityOptions}/>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table width='100%' className="p-1 pt-0" style={{textAlign: 'center'}}>
                        <thead style={{display: extendedPreview?'table-header-group':'none'}}>
                            <tr>
                                <td><strong><small>Priority</small></strong></td>
                                <td width='130px'><strong><small>BB Account</small></strong></td>
                                <td width='130px'><strong><small>ZD TIcket ID</small></strong></td>
                                <td><strong><small>Type</small></strong></td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{display: extendedPreview?'table-row':'none'}}>
                                <td className='liveColoring' style={{backgroundColor: getColor(livePriority)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={livePriority}
                                        onChange={(value) => { setPriority(value); updateStatus(props.settings.dowpriority,value.value);}}
                                        defaultValue={{
                                            label: 'Need to Prioritize',
                                            value: 'Need to Prioritize'
                                        }}
                                        options={PriorityOptions}/>
                                </td>
                                <td>
                                    <TextField
                                        className="m-auto"
                                        iconName="fa fa-square"
                                        size={TextField.sizes.MEDIUM}
                                        value={liveBB}
                                        onChange={(value) => { setBB(value); listenTimer1(props.settings.dowbb, value);}}
                                        wrapperClassName="monday-storybook-text-field_size"/>
                                </td>
                                <td>
                                    <TextField
                                        className="m-auto"
                                        iconName="fa fa-square"
                                        size={TextField.sizes.MEDIUM}
                                        value={liveZDTicket}
                                        onChange={(value) => { setTicketID(value); listenTimer2(props.settings.dowuserid, value);}}
                                        wrapperClassName="monday-storybook-text-field_size"/>
                                </td>
                                <td className='liveColoring' style={{backgroundColor: getColor(liveType)}}>
                                    <Dropdown
                                        className="dropdown-stories-styles_spacing mt-1"
                                        size={Dropdown.size.SMALL}
                                        searchable={false}
                                        clearable={false}
                                        value={liveType}
                                        onChange={(value) => { setType(value); updateStatus(props.settings.dowtype, value.value);}}
                                        defaultValue={{
                                            label: 'Select a Type',
                                            value: ''
                                        }}
                                        options={TypeOptions}/>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4}>
                                    <button onClick={() => toggleExtendedPreview(!extendedPreview)}>{extendedPreview?'Show less -':'Show more +'}</button>
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