import React, { useState, useEffect } from 'react';
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
const PriorityOptions = [
{
    label: 'Please fill-in',
    value: 'Please fill-in'
},
{
    label: 'P0 - Critical',
    value: 'P0 - CRITICAL'
},
{
    label: 'P1 - Urgent',
    value: 'P1 - Urgent'
},
{
    label: 'P2 - Important',
    value: 'P2 - Important'
},
{
    label: 'P3 - Fix needed',
    value: 'P3 - Fix needed'
},
{
    label: 'P4 - Best effort (DONT USE)',
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
            'bold',
            'underline',
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
    const [newDow_priority, setNPriority] = useState({label: "Pending"});
    const [newDow_domain, setNDomain] = useState("");

    const [newDow_description, setNDescription] = useState("");
    const [newDow_pictures, setNPictures] = useState("");
    const [newDow_boardexample, setNBoards] = useState("");
    const [newDow_itemexample, setNItems] = useState("");
    const [newDow_zdlink, setNZDlink] = useState("");
    const [newDow_userid, setNUser] = useState("");
    const [newDow_affected, setNAffected] = useState({label: "Pending"});
    const [newDow_OS, setNOS] = useState("");
    const [newDow_browser, setNBrowser] = useState("");

    const [newDow_automations, setNAuto] = useState("");
    const [newDow_autobehavior, setNAutoBehavior] = useState({label: "Pending"});
    const [newDow_triggers, setNTrigger] = useState("");
    const [newDow_timestamp, setNTimestamp] = useState("Pending");

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

        if(!newDow_name || newDow_name.trim() == ""){
            errorString += 'Name/Title is missing';
        }

        console.log('Domain is: ', newDow_domain);

        if(!newDow_domain || !newDow_domain.value || newDow_domain == ""){
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
        jsonValue[props.settings.dowlogin] = { label: newDow_login.value };
        jsonValue[props.settings.dowreproducible] = { label: newDow_reproducible.value };
        jsonValue[props.settings.dowpriority] = { label: newDow_priority.value };

        // BigBrain Account
        jsonValue[props.settings.dowbb] = `${newDow_bigbrain}`;
        
        let query = `mutation ($itemName: String, $board: Int!, $group: String, $valuesPack: JSON) {
            create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack){
                id
            }
        }`;

        let variables = {
            itemName: newDow_name,
            board: parseInt(props.settings.dowID),
            group: newDow_domain.value,
            valuesPack: JSON.stringify(jsonValue)
        }

        const itemResult = await writeToMonday(mondayInterface, query, variables, 'item', 5);

        if(itemResult == -1){
            props.monday.execute("notice", { 
                message: 'Error while creating the DoW, please try again later',
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 10000,
            });
            props.toggleWriting(false);
            return;
        }

        console.log("THIS SHOULD NOT APPEAR WHEN ERROR");
        console.log("Item creation: ", itemResult);
        const itemID = itemResult.data.create_item.id

        var EditorsParser = new DOMParser();
        var descriptionHTML = EditorsParser.parseFromString(newDow_description, 'text/html');
        var picturesHTML = EditorsParser.parseFromString(newDow_pictures, 'text/html');
        var filesPost = -1;

        if(descriptionHTML.getElementsByTagName('img').length > 0){
            let query = `mutation ($item: Int!, $body: String!) {create_update(item_id: $item, body: $body){id}}`;
            let variables = { item: parseInt(itemID), body: `<pre>&#xFEFF;Do not delete this update<br></pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre>` };
            let tempResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
            
            if(tempResult == -1){
                props.monday.execute("notice", { 
                    message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                    type: "error", // or "error" (red), or "info" (blue)
                    timeout: 20000,
                });
                props.toggleWriting(false);
                return;
            }
            
            filesPost = tempResult.data.create_update.id;
            console.log("updateID: ",filesPost);
            
            // Upload and replace pictures [pictures]
            for(let picture of descriptionHTML.getElementsByTagName('img')){
                // Upload the base64 picture to dummy 
                let query = `mutation ($update: Int!, $file: File!) {
                    add_file_to_update (update_id: $update, file: $file) {
                        id
                        url
                    }
                }`;
                let variables = { update: parseInt(filesPost), file: picture.src };
                tempResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
                
                if(tempResult == -1){
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
                picture.className = "post_image_group"
            }
        }

        if(picturesHTML.getElementsByTagName('img').length > 0){
            if(filesPost == -1){
                let query = `mutation ($item: Int!, $body: String!) { create_update(item_id: $item, body: $body){ id } }`;
                let variables = { item: parseInt(itemID), body: `<pre>&#xFEFF;Do not delete this update<br></pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre><pre>&#xFEFF;</pre>` };
                const tempResult =  await writeToMonday(mondayInterface, query, variables, 'update', 5);
            
                if(tempResult == -1){
                    props.monday.execute("notice", { 
                        message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                        type: "error", // or "error" (red), or "info" (blue)
                        timeout: 20000,
                    });
                    props.toggleWriting(false);
                    return;
                }
                
                filesPost = tempResult.data.create_update.id;
                console.log("updateID: ",filesPost);
            }
            
            // Upload and replace pictures [pictures]
            for(let picture of picturesHTML.getElementsByTagName('img')){
                // Upload the base64 picture to dummy 
                let query = `mutation ($update: Int!, $file: File!) {
                    add_file_to_update (update_id: $update, file: $file) {
                        id
                        url
                    }
                }`;
                let variables = { update: parseInt(filesPost), file: picture.src };

                const tempResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
            
                if(tempResult == -1){
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
                picture.className = "post_image_group"
            }
        }

        const bigbrainLink = newDow_bigbrain.trim() == "" ? '':`<a href="https://bigbrain.me/accounts/${newDow_bigbrain}/profile" target="_blank" rel="noopener">https://bigbrain.me/accounts/${newDow_bigbrain}/profile</a>`;

        let preformat = `<p><strong>1. Description of the issue: &#xFEFF;&#xFEFF;</strong></p>${descriptionHTML.body.innerHTML.toString().replaceAll('<p></p>','')}`;
        preformat +=`<p><br><strong>2. Screenshots/videos: </strong><br></p>`;
        preformat +=`${picturesHTML.body.innerHTML.toString().replaceAll('<p></p>','')}`;
        preformat +=`<p><br><strong>3. Permission to log in: </strong></p>`;
        preformat +=`<p><br></p>`;
        preformat +=`<p><strong>4. Further details</strong><br> </p>`;
        preformat +=`<p><strong>- Able to reproduce on your end: </strong> ${newDow_reproducible.label}</p>`;
        preformat +=`<p><strong>- Affects multiple users/boards:</strong> ${newDow_affected.label} </p>`;
        preformat +=`<p><strong>- Intermittent/stopped/never worked:</strong> ${newDow_autobehavior.label} </p>`;
        preformat +=`<p><strong>- Issue started/occured on: </strong> ${newDow_timestamp}<br><br> </p>`;
        preformat +=`<p><strong>- Board ID: </strong> ${newDow_boardexample} </p>`;
        preformat +=`<p><strong>- Item URL:</strong> ${newDow_itemexample}<br><br> </p>`;
        preformat +=`<p><strong>- Automation ID/s: ${newDow_automations}</strong> </p>`;
        preformat +=`<p><strong>- Trigger ID/s: ${newDow_triggers}</strong> </p>`;
        preformat +=`<p><br></p>`;
        preformat +=`<p><strong>ZD link: </strong>${newDow_zdlink} </p>`;
        preformat +=`<p><strong>BB: </strong>${bigbrainLink} </p>`;
        preformat +=`<p><strong>Account ID: </strong>${newDow_bigbrain}</p>`;
        preformat +=`<p><strong>User ID: </strong>${newDow_userid}</p>`;

        //console.log("Preformat final: ", preFormat);

        query = `mutation ($item: Int!, $body: String!) {
            create_update(item_id: $item, body: $body){
              id
            }
          }`;

        variables = { item: parseInt(itemID), body: preformat };

        let updateResult = await writeToMonday(mondayInterface, query, variables, 'update', 5);
        if(updateResult == -1){
            props.monday.execute("notice", { 
                message: `Error while creating update, item did create, please update it manually: https://${props.settings.slug}.monday.com/boards/${props.settings.dowID}/pulses/${itemID}`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 20000,
            });
            props.toggleWriting(false);
            return;
        }

        // Copy Item Values
        jsonValue = {};
        jsonValue[props.settings.helperdowstatus] = { label: 'New ticket' };
        jsonValue[props.settings.helperstatus] = { label: props.statusSelector('New ticket') };
        jsonValue[props.settings.helperdowitemid] = `${itemID}`;
        jsonValue[props.settings.helperdate] = { date: props.today() };
        jsonValue[props.settings.helperdowlink] = {
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
            create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack){
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

        if(copyResult == -1){
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
            message: `Dow created and synchronized correctly.`,
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
                    onKeyUp={(e) => {console.log('key pressed...')}}
                    wrapperClassName="monday-storybook-text-field_size"/>
            </div>

            <div className="mt-2">
                <div className="mb-1">Issue Description</div>
                <JoditEditor
                    config={configDescription}
                    value={newDow_description}
                    onChange={setNDescription}/>
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
                        options={props.domainGroups}/>
                </div>

                <div className="mt-2">
                    <span>Priority</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={false}
                        clearable={false}
                        onChange={setNPriority}
                        defaultValue={{
                            label: 'Please fill-in',
                            value: 'Please fill-in'
                        }}
                        options={PriorityOptions}/>
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

            <div className="mt-2">
                <div className="mb-1">Screenshots/Videos (include console)</div>
                <JoditEditor
                    config={configPictures}
                    value={newDow_pictures}
                    onChange={setNPictures}/>
            </div>

            <div className='ResponsiveGrid mt-2'>
                <div className="mt-2">
                    <TextField
                        className="m-auto"
                        iconName="fa fa-square"
                        placeholder="ex. 3455678, 23333124"
                        size={TextField.sizes.MEDIUM}
                        value={newDow_boardexample}
                        title='Board(s) ID'
                        onChange={setNBoards}
                        wrapperClassName="monday-storybook-text-field_size"/>
                </div>

                <div className="mt-2">
                    <TextField
                        className="m-auto"
                        iconName="fa fa-square"
                        placeholder="ex. 22234556, 2345674"
                        size={TextField.sizes.MEDIUM}
                        value={newDow_itemexample}
                        title='Item(s) ID'
                        onChange={setNItems}
                        wrapperClassName="monday-storybook-text-field_size"/>
                </div>
            </div>
            
            <div className='ResponsiveGrid mt-2'>
                <div className='mt-2'>
                    <div className="mb-1">Issue started/occured on</div>
                    <TextField 
                        size={TextField.sizes.MEDIUM} 
                        type={"datetime-local"}
                        value={newDow_timestamp}
                        onChange={setNTimestamp} />
                </div>

                <div className="mt-2">
                    <span>Affecting multiple users</span>
                    <Dropdown
                        className="dropdown-stories-styles_spacing mt-1"
                        searchable={false}
                        clearable={false}
                        onChange={setNAffected}
                        defaultValue={{
                            label: 'Pending',
                            value: 'Pending'
                        }}
                        options={SimpleOptions}/>
                </div>
            </div>

            {
                newDow_domain.label === 'Autopilot Core' ? (<>
                    <div className="mt-2">
                        <span>Automation Behavior</span>
                        <Dropdown
                            className="dropdown-stories-styles_spacing mt-1"
                            searchable={false}
                            clearable={false}
                            onChange={setNAutoBehavior}
                            defaultValue={{
                                label: 'Pending',
                                value: 'Pending'
                            }}
                            options={FunctionOptions}/>
                    </div>
                    <div className="mt-2">
                        <TextField
                            className="m-auto"
                            iconName="fa fa-square"
                            placeholder="ex. 599763"
                            size={TextField.sizes.MEDIUM}
                            value={newDow_automations}
                            title='Automations ID'
                            onChange={setNAuto}
                            wrapperClassName="monday-storybook-text-field_size"/>
                    </div>
                    <div className="mt-2">
                        <TextField
                            className="m-auto"
                            iconName="fa fa-square"
                            placeholder="ex. 599763"
                            size={TextField.sizes.MEDIUM}
                            value={newDow_triggers}
                            title='Triggers ID'
                            onChange={setNTrigger}
                            wrapperClassName="monday-storybook-text-field_size"/>
                    </div>
                </>):(<>
                    <div className='ResponsiveGrid mt-2'>
                        <div className="mt-2">
                            <TextField
                                className="m-auto"
                                iconName="fa fa-square"
                                placeholder="ex. windows 11"
                                size={TextField.sizes.MEDIUM}
                                value={newDow_OS}
                                title='Operative System'
                                onChange={setNOS}
                                wrapperClassName="monday-storybook-text-field_size"/>
                        </div>

                        <div className="mt-2">
                            <TextField
                                className="m-auto"
                                iconName="fa fa-square"
                                placeholder="ex. Chrome v132.0.24"
                                size={TextField.sizes.MEDIUM}
                                value={newDow_browser}
                                title='Browser'
                                onChange={setNBrowser}
                                wrapperClassName="monday-storybook-text-field_size"/>
                        </div>
                    </div>
                </>)
            }

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