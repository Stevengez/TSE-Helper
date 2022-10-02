import React, { useState } from 'react';
import JoditEditor from "jodit-react";
import { Button, TextField, Dropdown } from "monday-ui-react-core";

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
];
const FunctionOptions = [
    {
        label: 'Pending',
        value: 'Pending'
    },
    {
        label: 'Intermitent',
        value: 'Intermitent'
    },
    {
        label: 'Stopped working',
        value: 'Stopped working'
    },
    {
        label: 'Never worked',
        value: 'Never worked'
    }
];
const SimpleOptions = [
    {
        label: 'Pending',
        value: 'Pending'
    },
    {
        label: 'Yes',
        value: 'Yes'
    },
    {
        label: 'No',
        value: 'No'
    }
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

const Editor = (props) => {

    const [configDescription, setDConfig] = useState({
		toolbar: false,
        placeholder: 'A detailed description...',
        tabIndex: 0
	});

    const [configPictures, setPConfig] = useState({
        toolbar: true,
        placeholder: '',
        tabIndex: 0,
        colorPickerDefaultTab: 'text',
        removeButtons: [
            'fontsize',
            'undo', 'redo',
            'symbol',
            'fullsize',
            'print',
            'about'
        ]
	});

    const [newDow_name, setNName] = useState("");
    const [newDow_bigbrain, setNBigBrain] = useState("");
    const [newDow_login, setNLogin] = useState({label: "Pending"});
    const [newDow_reproducible, setNReproducible] = useState({label: "Pending"});
    const [newDow_severity, setNSeverity] = useState({label: "Pending"});
    const [newDow_domain, setNDomain] = useState("");

    const [newDow_update, setNUpdate] = useState("<p><strong>1. Description of the issue:</strong>&nbsp;</p><p><strong><br></strong></p><p><strong>2. Steps to reproduce:</strong>&nbsp;</p><br><p><strong>3. Screenshots/videos:&nbsp;</strong></p><p><strong><br></strong></p><p>Further details</p><p><strong>Affects multiple users?</strong>&nbsp;</p><p><strong>Intermittent/Stopped/Never worked:</strong>&nbsp;</p><p><strong>When did the issue start?</strong>&nbsp;</p><p><strong>The most recent time frame (with timezone) they have experienced the issue:</strong>&nbsp;</p><br><p>IDs:</p><p><strong>Automation ID:</strong>&nbsp;</p><p><strong>Board ID:</strong>&nbsp;</p><p><strong>Item ID:</strong>&nbsp;</p>");
    const [newDow_zdlink, setNZDlink] = useState("");
    const [newDow_userid, setNUser] = useState("");

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

    const saveDow = async () => {

        let errorString = '';

        if(!newDow_name || newDow_name.trim() === ""){
            errorString += 'Name/Title is missing';
        }

        console.log('Domain is: ', newDow_domain);

        if(!newDow_domain || !newDow_domain.value || newDow_domain === ""){
            errorString += errorString.length > 0 ? ', ':'';
            errorString += 'Select a domain to place the dow';
        }

        if(errorString !== ''){
            props.monday.execute("notice", { 
                message: `Error: ${errorString}`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 5000,
              });
              return;
        }

        props.toggleWriting(true);

        let mondayInterface = props.monday;

        if(props.settings.externaldow){
            mondayInterface = props.remoteMonday;
        }

        // Create Remote DoW
        let jsonValue = {};

        // Login, Reproducible, Priority
        jsonValue[props.settings.dowdomain] = { label: newDow_domain.value };
        jsonValue[props.settings.dowseverity] = { label: newDow_severity.value };

        jsonValue[props.settings.dowlogin] = { label: newDow_login.value };
        jsonValue[props.settings.dowreproducible] = { label: newDow_reproducible.value };
        jsonValue[props.settings.dowseverity] = { label: newDow_severity.value };

        
        // BigBrain Account
        jsonValue[props.settings.dowbb] = newDow_bigbrain ;
        jsonValue[props.settings.dowuserid] = newDow_userid ;
        
        let query = `mutation ($itemName: String, $board: Int!, $group: String, $valuesPack: JSON) {
            create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack){
                id
            }
        }`;

        let variables = {
            itemName: newDow_name,
            board: parseInt(props.settings.dowID),
            //group: "new_group41530", // Static Selection of "Untouched" group
            group: "new_group27854", // Static Test Selection of "Untouched" group
            valuesPack: JSON.stringify(jsonValue)
        }

        const itemResult = await writeToMonday(mondayInterface, query, variables, 'item', 5);

        if(itemResult === -1){
            props.monday.execute("notice", { 
                message: 'Error while creating the DoW, please try again later',
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 10000,
            });
            props.toggleWriting(false);
            return;
        }

        const itemID = itemResult.data.create_item.id;

        var EditorsParser = new DOMParser();
        var descriptionHTML = EditorsParser.parseFromString(newDow_update, 'text/html');
        var filesPost = -1;

        if(descriptionHTML.getElementsByTagName('img').length > 0){
            if(filesPost === -1){
                let query = `mutation ($item: Int!, $body: String!) { create_update(item_id: $item, body: $body){ id } }`;
                let variables = { item: parseInt(itemID), body: `<p style="display:none;">#TSE_HELPER#</p><pre>&#xFEFF;Do not delete this update<br></pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre>` };
                const tempResult =  await writeToMonday(mondayInterface, query, variables, 'update', 5);
            
                if(tempResult === -1){
                    props.monday.execute("notice", { 
                        message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 20000,
                    });
                    props.toggleWriting(false);
                    return;
                }
                
                filesPost = tempResult.data.create_update.id;
            }
            
            // Upload and replace pictures [pictures]
            for(let picture of descriptionHTML.getElementsByTagName('img')){
                // Verify if this is a base64 img
                if(picture.src.substring(0,4) === "data"){
                    // Upload the base64 picture to dummy 
                    let query = `mutation ($update: Int!, $file: File!) {
                        add_file_to_update (update_id: $update, file: $file) {
                            id
                            url
                        }
                    }`;
                    let variables = { update: parseInt(filesPost), file: picture.src };

                    const tempResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
                
                    if(tempResult === -1){
                        props.monday.execute("notice", { 
                            message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                            type: "error", // or "error" (red), or "info" (blue)
                            timeout: 20000,
                        });
                        props.toggleWriting(false);
                        return;
                    }

                    const fileReference = tempResult.data.add_file_to_update;
                    picture.src = fileReference.url;
                
                }
                picture.className = "post_image_group"
            }
        }

        query = `mutation ($item: Int!, $body: String!) {
            create_update(item_id: $item, body: $body){
                id
            }
        }`;
        
        const bigbrainLink = newDow_bigbrain.trim() === "" ? '':`<a href="https://bigbrain.me/accounts/${newDow_bigbrain}/profile" target="_blank" rel="noopener">https://bigbrain.me/accounts/${newDow_bigbrain}/profile</a>`;
        let fullUpdate = descriptionHTML.body.innerHTML.toString().replaceAll('<p></p>','') + `<p><br></p><p>Account details:&nbsp;</p><p><strong>ZD Link:</strong>&nbsp;<a href="${newDow_zdlink}">${newDow_zdlink}</a></p><p><strong>BB:</strong>&nbsp;${bigbrainLink}</p><p><strong>Account ID:</strong>&nbsp;${newDow_bigbrain}</p><p><strong>User ID: </strong>${newDow_userid}</p>`;

        variables = { item: parseInt(itemID), body: fullUpdate };

        let updateResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
        if(updateResult === -1){
            props.monday.execute("notice", { 
                message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 20000,
            });
            props.toggleWriting(false);
            return;
        }

        if(
            !props.settings.helperdowstatus || 
            !props.settings.helperstatus || 
            !props.settings.helperdowitemid ||
            !props.settings.helperdate ||
            !props.settings.helperdowlink
        ){
            props.monday.execute("notice", { 
                message: `Missing settings for local board, fix and import it later with with ID: ${itemID}`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 25000,
            });
            props.toggleWriting(false);
            return;
        }

        // Copy Item Values
        jsonValue = {};
        jsonValue[Object.keys(props.settings.helperdowstatus)[0]] = { label: 'New ticket' };
        jsonValue[Object.keys(props.settings.helperstatus)[0]] = { label: props.statusSelector('New ticket') };
        jsonValue[Object.keys(props.settings.helperdowitemid)[0]] = `${itemID}`;
        jsonValue[Object.keys(props.settings.helperdate)[0]] = { date: props.today() };
        jsonValue[Object.keys(props.settings.helperdowlink)[0]] = {
            url:`https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
            text: 'DoW Board'
        };
        if(newDow_zdlink && newDow_zdlink.trim() !== ""){
            jsonValue[props.settings.helperzdlink] = {
                url:`${newDow_zdlink}`,
                text: 'ZD Link'
            };
        }

        query = `mutation ($itemName: String, $board: Int!, $group: String, $valuesPack: JSON) {
            create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack, create_labels_if_missing: true){
                id
            }
        }`;

        variables = {
            itemName: newDow_name,
            board: parseInt(props.helperboard),
            group: props.settings.backtodev,
            valuesPack: JSON.stringify(jsonValue)
        };

        const copyResult = await writeToMonday(props.monday, query, variables, 'local item', 5);

        if(copyResult === -1){
            props.monday.execute("notice", { 
                message: `Error when creating item in your local board, import it later with with ID: ${itemID}`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 25000,
            });
            props.toggleWriting(false);
            return;
        }
        
        props.toggleWriting(false);

        props.monday.execute("notice", { 
            message: `Dow created and synchronized correctly: ${itemID}`,
            type: "success", // or "error" (red), or "info" (blue)
            timeout: 10000,
        });
    }
  
    return (
        <>
            <div>
                <TextField
                    className="m-auto"
                    iconName="fa fa-square"
                    placeholder="Issue/DoW title"
                    size={TextField.sizes.MEDIUM}
                    title='Name'
                    value={newDow_name}
                    onChange={setNName}
                    wrapperClassName="monday-storybook-text-field_size"/>
            </div>

            <div className="mt-2">
                <div className="mb-1">Issue Description</div>
                <JoditEditor
                    config={configPictures}
                    value={newDow_update}
                    onChange={(value) => setNUpdate(value)}/>
                <style>
                    {`.jodit-status-bar { display: none; }`}
                </style>
            </div>

            <div className='ResponsiveGrid mt-2'>
                <div className="mt-2">
                    <span>Domain</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={true}
                        clearable={false}
                        onChange={setNDomain}
                        defaultValue={{
                            label: 'Select the domain',
                            value: 0
                        }}
                        options={DomainOptions}/>
                </div>

                <div className="mt-2">
                    <span>Severity</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={false}
                        clearable={false}
                        onChange={setNSeverity}
                        defaultValue={{
                            label: 'Please fill-in',
                            value: 'Please fill-in'
                        }}
                        options={SeverityOptions}/>
                </div>
            </div>
            
            <div className='ResponsiveGrid mt-2'>
                <div className="mt-2">
                    <span>Login Permission</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={false}
                        clearable={false}
                        onChange={setNLogin}
                        defaultValue={{
                            label: 'Pending',
                            value: 'Please fill-in'
                        }}
                        options={LoginOptions}/>
                </div>

                <div className="mt-2">
                    <span>Reproducible</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={false}
                        clearable={false}
                        onChange={setNReproducible}
                        defaultValue={{
                            label: 'Please fill-in',
                            value: 'Please fill-in'
                        }}
                        options={ReproducibleOptions}/>
                </div>
            </div>

            <div className='ResponsiveGrid mt-2'>
                <div className="mt-2">
                    <TextField
                        className="m-auto"
                        iconName="fa fa-square"
                        placeholder="ex. 599763"
                        size={TextField.sizes.MEDIUM}
                        value={newDow_bigbrain}
                        title='BigBrain Account'
                        onChange={setNBigBrain}
                        wrapperClassName="monday-storybook-text-field_size"/>
                </div>

                <div className="mt-2">
                    <TextField
                        className="m-auto"
                        iconName="fa fa-square"
                        placeholder="ex. 2334412"
                        size={TextField.sizes.MEDIUM}
                        value={newDow_userid}
                        title='User ID'
                        onChange={setNUser}
                        wrapperClassName="monday-storybook-text-field_size"/>
                </div>
            </div>

            <div className="mt-2">
                <TextField
                    className="m-auto"
                    iconName="fa fa-square"
                    placeholder="http://..."
                    size={TextField.sizes.MEDIUM}
                    value={newDow_zdlink}
                    title='Zendesk Link'
                    onChange={setNZDlink}
                    wrapperClassName="monday-storybook-text-field_size"/>
            </div>            

            <div className="d-flex jf-end mt-2">
                <Button onClick={saveDow} loading={props.loading||props.writing}>Create</Button>
            </div>
        </>
    );
};

export default Editor;