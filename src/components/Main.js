import React, { useEffect, useState, useRef } from "react";
import "../App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css"
import "../Style/helper.css";
import "../Style/customAccordion.css";
//Explore more Monday React Components here: https://style.monday.com/
import { Button, TextField } from "monday-ui-react-core";

import { 
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel 
} from 'react-accessible-accordion';
import Editor from "./Editor/Editor";

const monday = mondaySdk();
const remoteMonday = mondaySdk();
const appVersion = '1.0';

const Main = () => {

  //Settings
  const [settings, setSettings] = useState();
  const [context, setContext] = useState();
  const [boardData, setData] = useState();
  const [userName, setName] = useState('...');
  const [userIds, setUserIds] = useState([]);
  const [domainGroups, setDomainGroups] = useState([]);
  
  const settingsRef = useRef();
        settingsRef.current = settings;

  const contextRef = useRef();
        contextRef.current = context;

  const boardDataRef = useRef();
        boardDataRef.current = boardData;

  const useridsRef = useRef();
        useridsRef.current = userIds;
  
  // Input Values
  const [singleDow, setSingleDow] = useState("");

  //Live Data
  const [myItems, setMyItems] = useState([]);
  const [loading, toggleLoading] = useState(false);
  const [writing, toggleWriting] = useState(false);
  
  const myItemsRef = useRef();
        myItemsRef.current = myItems;
  const loadingRef = useRef();
        loadingRef.current = loading;
  const writingRef = useRef();
        writingRef.current = writing;
  
  useEffect(() => {
    const uSettings = monday.listen("settings", res => {
      // Set API token for sdk in case is external
      
      //Default values
      // const tempSettings = {...res.data,
      //   externaldow: false,
      //   slug: 'stevensandbox',
      //   dowID: "2900890876",
      //   apitoken: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE1Nzg3NzkzNCwidWlkIjoyOTk2MDE2MiwiaWFkIjoiMjAyMi0wNC0yN1QyMDoyNzoyNC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE5NTUxOTYsInJnbiI6InVzZTEifQ.HscF4mE4hmrzKukXSJh-2xxAdgjZqWXkvDgG-aK-10s',
      //   dowstatus: 'status0',
      //   dowbb: 'text',
      //   dowlogin: 'status_1',
      //   dowreproducible: 'status_13',
      //   dowpriority: 'status_18',
      //   dowdomain: 'status7',
      //   helperstatus: 'status',
      //   helperdowstatus: 'status_19',
      //   helperdowitemid: 'text4',
      //   helperdowlink: 'link_1',
      //   helperzdlink: 'link',
      //   helperdate: 'date',
      //   backtodev: 'topics',
      //   backtoreporter: 'group_title',
      //   movedtobugs: 'new_group63710',
      //   helperipp: "2"
      // };

      //Default Real Board
      const tempSettings = {...res.data,
        externaldow: true,
        slug: 'monday',
        dowID: "620317422",
        apitoken: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE2ODk0MTkxMiwidWlkIjoyOTk1NTQ5MCwiaWFkIjoiMjAyMi0wNy0wNlQwMTo1MjoxMy4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NSwicmduIjoidXNlMSJ9.4_XeLCv71GKYyuvLbc-QYZ22ZS6wbIEyOlI1xgWW1cE',
        dowstatus: 'status',
        dowbb: '_bigbrain_account_id',
        dowlogin: 'status_15',
        dowreproducible: 'status_18',
        dowpriority: 'status_1',
        dowdomain: 'status0',
        helperstatus: 'status',
        helperdowstatus: 'status_19',
        helperdowitemid: 'text4',
        helperdowlink: 'link_1',
        helperzdlink: 'link',
        helperdate: 'date',
        backtodev: 'topics',
        backtoreporter: 'group_title',
        movedtobugs: 'new_group63710',
        helperipp: "100"
      };

      // for(let k in tempSettings){
      //   if(res.data[k] != null && res.data[k] !== ""){
      //     tempSettings[k] = res.data[k];
      //   }
      // }

      // console.log("Settings Token for external API: eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE2OTU5NjczMCwidWlkIjozMDA0MDU2OSwiaWFkIjoiMjAyMi0wNy0xMFQwNTowMTowMy4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE5ODUyODgsInJnbiI6InVzZTEifQ.y2wdQvqPYJD7qZ-TjMaP1hN2FBGxY7dhDL_gq5dHtj8");
      remoteMonday.setToken(tempSettings.apitoken);

      //setSettings(res.data);
      setSettings(tempSettings);
      const users = [...res.data.users.teammates];
      if(contextRef.current) users.push(contextRef.current.user.id);
      
      setUserIds([...new Set(users)]);
      console.log("Users: ", useridsRef.current);
      
      //console.log("SettingsRef: ",settingsRef.current);
    });

    const uContext = monday.listen("context", res => {
      if(!contextRef.current){
        setContext(res.data);
        setUserIds([...new Set([...useridsRef.current, res.data.user.id])]);
        console.log("Users: ", useridsRef.current);
      }else{
        for(let k in res.data){
          contextRef.current[k] = res.data[k];
        }
        setContext(contextRef.current);
        updateLocalItems();
      }
    });
    
    return (() => {
      uSettings();
      uContext();      
    })
  },[]);

  // Get Local Items
  useEffect(() => {
    if(context){
      monday.api(`query ($boards: [Int]) {
        me{
          name
        }
        boards (ids: $boards){
          items {
            id
            name
            column_values {
              id
              title
              text
              value
            }
          }
        }  
      }`, {
        variables: {
          boards: context.boardIds
        }
      }).then( res => {
        if(res.data.boards){
          setName(res.data.me.name);
          setData(res.data.boards[0].items);
        }
      });
    }
  }, context);

  // Get Local Board Data
  const updateLocalItems = () =>{
    if(!writingRef.current){
      monday.api(`query ($board: [Int]) {
        boards (ids: $board){
          items {
            id
            name
            column_values {
              id
              title
              text
              value
            }
          }
        }
      }`, {
        variables: {
          board: contextRef.current.boardIds
        }
      }).then( res => {
        if(res.data.boards){
          setData(res.data.boards[0].items);
        }
      });
    }
  }

  // Get Domain Group List
  useEffect(() => {
    //620317422
    if(settings){
      let mondayInterface = monday;
      if(settings.externaldow){
        console.log("Retrieving domains from external board");
        mondayInterface = remoteMonday;
      }

      console.log("dow :", settings.dowID);

      if(settings.dowID && settings.dowID.trim() != ""){
        console.log("Listo para cargar dominios",settings);
        mondayInterface.api(`query ($board: [Int]){
          boards(ids: $board){
            groups {
              id
              title
            }
          }
        }`, {
          variables: {
            board: parseInt(settings.dowID)
          }
        }).then(result => {
          console.log("Groups: ", result);
          let groups = [];
          if(result.data.boards.length > 0){
            if(result.data.boards[0].groups.length > 0){
              result.data.boards[0].groups.forEach((g) => {
                groups.push({
                  label: g.title,
                  value: g.id
                });
              });
              setDomainGroups(groups);
            }else{
              monday.execute("notice", { 
                message: `No Domains found for Board [${settings.dowID}], is it correct?`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 5000,
              });
              console.log("No domains found found for: ", settings.dowID);
            }
          }else{
            monday.execute("notice", { 
              message: `Board [${settings.dowID}] not found, is it correct?`,
              type: "error", // or "error" (red), or "info" (blue)
              timeout: 5000,
            });
            console.log("No board found for: ", settings.dowID);
          }
        });
      }else{
        monday.execute("notice", { 
          message: `Unable to retrieve domains, DoW Board is not set`,
          type: "error", // or "error" (red), or "info" (blue)
          timeout: 3000,
        });
      }
    }
  }, [settings]);

  // Open Item CardBoard to see from here
  const OpenLiveView = () => {
    const errorString = settingsValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error", // or "error" (red), or "info" (blue)
        timeout: 5000,
      });
      return;
    }

    console.log("Trigger open card for: ",singleDow);
    monday.execute('openAppFeatureModal',{
      urlPath: ``,
      urlParams: {
        live: true,
        itemId: singleDow
      },
      width: 600,
      height: 800
    }).then((res) => {
      console.log(res.data);
      // The above is a callback to see if a user closed the modal from the inside. This is useful should you want to run some logic within the app window. 
   });
  }

  // Check Settings
  const settingsValidate = () => {
    let errorStrig = 'Please make sure to fill these settings values: \n';
    let errorPresent = false;

    console.log("AjustesValidation: ", settings);

    if(settings.externaldow && settings.apitoken.toString().trim() == ""){
      errorStrig += "* API Token\n";
      errorPresent = true;
    }

    if(!settings.dowID || settings.dowID.trim() == ""){
      errorStrig += "* DoW Board ID\n";
      errorPresent = true;
    }

    if(!settings.slug || settings.slug.trim() == ""){
      errorStrig += "* Account Slug\n";
      errorPresent = true;
    }

    if(!settings.dowstatus || settings.dowstatus.trim() == ""){
      errorStrig += "* [DoW Col ID] Status\n";
      errorPresent = true;
    }

    if(!settings.dowbb || settings.dowbb.trim() == ""){
      errorStrig += "* [DoW Col ID] BigBrain\n";
      errorPresent = true;
    }

    if(!settings.dowlogin || settings.dowlogin.trim() == ""){
      errorStrig += "* [DoW Col ID] Login Permission\n";
      errorPresent = true;
    }

    if(!settings.dowreproducible || settings.dowreproducible.trim() == ""){
      errorStrig += "* [DoW Col ID] Reproducible\n";
      errorPresent = true;
    }

    if(!settings.dowpriority || settings.dowpriority.trim() == ""){
      errorStrig += "* [DoW Col ID] Priority\n";
      errorPresent = true;
    }

    if(!settings.helperstatus || settings.helperstatus.trim() == ""){
      errorStrig += "* [Local Board] Status\n";
      errorPresent = true;
    }

    if(!settings.helperdowstatus || settings.helperdowstatus.trim() == ""){
      errorStrig += "* [Local Board] DoW Status\n";
      errorPresent = true;
    }

    if(!settings.helperdowitemid || settings.helperdowitemid.trim() == ""){
      errorStrig += "* [Local Board] DoW ItemID\n";
      errorPresent = true;
    }

    if(!settings.helperdowlink || settings.helperdowlink.trim() == ""){
      errorStrig += "* [Local Board] DoW Link\n";
      errorPresent = true;
    }

    if(!settings.helperzdlink || settings.helperzdlink.trim() == ""){
      errorStrig += "* [Local Board] ZD Link\n";
      errorPresent = true;
    }

    if(!settings.helperdate || settings.helperdate.trim() == ""){
      errorStrig += "* [Local Board] Followup Date\n";
      errorPresent = true;
    }

    if(!settings.backtodev || settings.backtodev.trim() == ""){
      errorStrig += "* [Local Board] Back to Dev\n";
      errorPresent = true;
    }

    if(!settings.backtoreporter || settings.backtoreporter.trim() == ""){
      errorStrig += "* [Local Board] Waiting for Reporter\n";
      errorPresent = true;
    }

    if(!settings.movedtobugs || settings.movedtobugs.trim() == ""){
      errorStrig += "* [Local Board] Moved to bugs\n";
      errorPresent = true;
    }

    if(!settings.helperipp || settings.helperipp.trim() == ""){
      errorStrig += "* [Local Board] IPP\n";
      errorPresent = true;
    }

    return errorPresent?errorStrig:'';
  }

  // Get Single DoW
  const SyncSingleDow = () => {
    //2918221781
    // Select mondayapi based on settings

    const errorString = settingsValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error", // or "error" (red), or "info" (blue)
        timeout: 5000,
      });
      return;
    }

    toggleLoading(true);
    let mondayInterface;
    if(settings.externaldow){
      if(settings.apitoken.trim() == ""){
        //window.alert('You need to type your apitoken first');
        console.log("API TOKEN REQUIRED");
      }
      mondayInterface = remoteMonday;
    }else{
      mondayInterface = monday;
    }

    mondayInterface.api(`query ($item: [Int]) {
      items(ids: $item) {
        id
        name
        column_values {
          id
          value
          text
        }
      }
    }
    `, { 
      variables: {
        item: parseInt(singleDow)
      }
    }).then(res => {
      const items = res.data.items;
      if(items.length > 0){
        setMyItems([...myItemsRef.current, ...items]);
        toggleLoading(false);
        FillBoard(true);
      }else{
        monday.execute("notice", { 
          message: `Dow [${singleDow}] not found.`,
          type: "error", // or "error" (red), or "info" (blue)
          timeout: 5000,
        });
        toggleLoading(false);
      }
    });
  }
  
  // Get DoW Board Data
  const SyncDowData = () => {

    const errorString = settingsValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error", // or "error" (red), or "info" (blue)
        timeout: 5000,
      });
      return;
    }

    if(settingsRef.current.dowID !== ""){
      toggleLoading(true);
      getPageItems(1);
    }else{
      console.log("Sync pending");
    }
  }

  const compareItem = (local, remote) => {
    //console.log(`Item Compare: [local] ${getText(local, 'DoW Status')} vs  [remote] ${getText(remote, 'Status')}`);
    if(getText(local, settings.helperdowstatus) === getText(remote, settings.dowstatus)) return false;
    return true;
  }

  const compareItems = () => {
    const localCopy = boardDataRef.current.slice();
    const remoteCopy = myItemsRef.current.slice();
    
    const RemotePendingCreation = [];
    const RemotePendingUpdate = [];

    while(remoteCopy.length > 0){
      let c = 0;
      let found = false;
      for(let local_Item of localCopy){
        //const lid = getText(local_Item.column_values, settings.helperdowitemid);
        if(remoteCopy[0].id === getText(local_Item.column_values, settings.helperdowitemid)){
          found = true;
          if(compareItem(local_Item.column_values, remoteCopy[0].column_values)){
            RemotePendingUpdate.push({...remoteCopy[0], localID: local_Item.id}); 
          }
          break;
        }
        c++;
      }
      
      // If found, remove from LocalCopy
      if(found){
        localCopy.splice(c, 1);
      }

      // If Not found push to creation pending
      if(!found){
        RemotePendingCreation.push(remoteCopy[0]);
      }

      // No matter found or not, remove from RemoteCopy
      remoteCopy.splice(0, 1);
    } 

    return { create: RemotePendingCreation, update: RemotePendingUpdate};
  }

  const FillBoard = (isSingleSync = false) => {
    const { create, update } = compareItems();

    // Create Non Existing
    const pendingWorks = [];
    toggleWriting(true);

    if(settingsRef.current.updateExisting){
      update.forEach((dow) => {
        const doWStatus = getText(dow.column_values, settings.dowstatus);
        const jsonValue = {
          label: doWStatus
        };
  
        const work = monday.api(`mutation ($board: Int!, $item: Int, $column: String!, $value: JSON!) {
          change_column_value(board_id: $board, item_id: $item, column_id: $column, value: $value){
            id
          }
        }`, {
          variables: {
            board: parseInt(context.boardIds),
            item: parseInt(dow.localID),
            column: settings.helperdowstatus,
            value: JSON.stringify(jsonValue)
          }
        });
        
        work.then((result) => {
          console.log("Result: ",result);
        });

        pendingWorks.push(work);
      });
    }

    create.forEach((dow) => {
      const localStatus = SelectStatusByStatus(getText(dow.column_values, settings.dowstatus));
      const doWStatus = getText(dow.column_values, settings.dowstatus);
      const groupTarget = SelectGroupByStatus(doWStatus);
      const jsonValue = {};

      // Set Date
      jsonValue[settings.helperdate] = {
        date: getToday()
      };

      // Set Local Status
      jsonValue[settings.helperstatus] = {
        label:localStatus
      };

      // Set DoW Status
      jsonValue[settings.helperdowstatus] = {
        label:doWStatus
      };

      // Set DoW Link
      jsonValue[settings.helperdowlink] = {
        url:`https://${settingsRef.current.slug}.monday.com/boards/${settingsRef.current.dowID}/pulses/${dow.id}`,
        text: 'DoW Board'
      };

      // Set DoW RemoteID
      jsonValue[settings.helperdowitemid] = `${dow.id}`;

      const work = monday.api(`mutation ($itemName: String, $board: Int!, $group: String, $valuesPack: JSON) {
        create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack){
          id
        }
      }`, {
        variables: {
          itemName: dow.name,
          board: parseInt(context.boardIds),
          group: groupTarget,
          valuesPack: JSON.stringify(jsonValue)
        }
      });

      work.then((result) => {
        console.log("Result: ",result);
      });

      pendingWorks.push(work);
    });
    
    Promise.all(pendingWorks).then((values) => {
      toggleWriting(false);
      let resultMessage = getFillMessageResult(create, update, isSingleSync);
      
      monday.execute("notice", { 
          message: resultMessage,
          type: "success", // or "error" (red), or "info" (blue)
          timeout: 3000,
      });
      updateLocalItems();
    });

    setMyItems([]);
  }

  const getFillMessageResult = (create, update, isSingleSync) => {
    let resultMessage = "";

    if(settingsRef.current.updateExisting){
      // Update is enabled
      if(isSingleSync){
        // Sync for single dow
        if(update.length > 0){
          // No updates
          return '1 dow updated.';
        }

        if(create.length > 0){
          return `1 dow imported.`;
        }

        return `Dow [${singleDow}] Already exists`;
      }else{
        // General sync
        if(update.length > 0){
          // No updates
          resultMessage += `${update.length} dow updated and `;       
        }
        resultMessage += `${create.length} dow imported.`;
      }
    }else{
      // Update is enabled
      if(isSingleSync){
        // Sync for single dow
        if(create.length > 0){
          return `1 dow imported.`;
        }

        return `Dow [${singleDow}] Already exists`;
      }else{
        // General sync
        if(create.length > 0){
          resultMessage += `${create.length} dow imported.`;
        }else{
          return 'You are up to date, no new dow found.'
        }        
      }
    }

    return resultMessage;
  }

  const getToday = () => {
    const date = new Date();
    const month = date.getMonth()+1;
    const day = date.getDate()+1;
    const year = date.getFullYear();
    return year+'-'+month+'-'+day;
  }

  const getValue = (column_values, targetId) => {
    const colIdx = column_values.findIndex((c) => {
      return c.id === targetId;
    });

    if(colIdx !== -1){
      return column_values[colIdx].value;
    }else{
      console.log(`${targetId} doesn't exists`);
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

  const SelectStatusByStatus = (status) => {
    switch(status){
      case 'Back to dev':
      case 'New ticket':
        return 'Follow Up';
      case 'Move back to reporter':
        return 'Pending';
      case 'Moved to bugs Q':
        return 'Long Term Bug';
      default:
        return 'Follow Up';
    }
  }

  const SelectGroupByStatus = (status) => {
    switch(status){
      case 'Back to dev':
      case 'New ticket':
        return settings.backtodev;
      case 'Move back to reporter':
        return settings.backtoreporter;
      case 'Moved to bugs Q':
        return settings.movedtobugs;
      default:
        return settings.backtodev;
    }
    
  }

  const getPageItems = (page) => {
    // Select mondayapi based on settings
    let mondayInterface;
    if(settings.externaldow){
      mondayInterface = remoteMonday;
    }else{
      mondayInterface = monday;
    }

    mondayInterface.api(`query ($board: [Int]) {
      boards (ids: $board){
        items(limit: ${settingsRef.current.helperipp}, page: ${page}) {
          id
          name
          creator {
            id
          }
          column_values {
            id
            value
            text
          }
        }
      }  
    }
    `, { 
      variables: {
        board: parseInt(settingsRef.current.dowID)
      }
    }).then(res => {
      const board = res.data.boards[0];
      const items = board.items;
      
      if(items.length > 0){
        const newBatch  = items.filter((i) => {
          return useridsRef.current.includes(i.creator.id.toString());
        });
        setMyItems([...myItemsRef.current, ...newBatch]);
        getPageItems(page+1);
      }else{
        toggleLoading(false);
        FillBoard();
      }
    });
  }

  return(<div className="Container d-flex d-col-dir px-3 pb-3 bg-white">
      <div>
        <h2>Welcome {userName}</h2>
      </div>
      
      <div>
        <Accordion preExpanded={[0]} allowZeroExpanded>
          <AccordionItem uuid={0}>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      What is TSE Helper?
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                  <p>TSE Helper is a tool developed to help you with follow up and creation of DoW's (in the future also Bugs and Cheeses).</p>
              </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      How to begin?
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                  <p>You can now syncronize the information from the DoW Board.</p>
                  <Button onClick={SyncDowData} loading={loading||writing}>
                    <strong>Sync my &nbsp;DoW cases</strong>
                  </Button>
              </AccordionItemPanel>
          </AccordionItem>
          
          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      Tools
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>

                <Accordion allowZeroExpanded>
                  <AccordionItem>
                      <AccordionItemHeading>
                          <AccordionItemButton>
                              DoW Live view 
                          </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <div className="d-flex d-row-dir jf-center">
                          <TextField
                            className="m-auto"
                            iconName="fa fa-square"
                            placeholder="item id"
                            value={singleDow.replace(/\D/g, '')}
                            onChange={(value) => setSingleDow(value.replace(/\D/g, ''))}
                            wrapperClassName="monday-storybook-text-field_size"
                          />
                          <div className="m-auto pl-1">
                            <Button onClick={OpenLiveView} loading={loading||writing} size={Button.sizes.SMALL} disabled={singleDow == ""}>
                              Open Live View
                            </Button>
                          </div>
                        </div>
                      </AccordionItemPanel>
                  </AccordionItem>

                  <AccordionItem>
                      <AccordionItemHeading>
                          <AccordionItemButton>
                              Import single dow
                          </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <div className="d-flex d-row-dir jf-center">
                          <TextField
                            className="m-auto"
                            iconName="fa fa-square"
                            placeholder="item id"
                            value={singleDow.replace(/\D/g, '')}
                            onChange={(value) => setSingleDow(value.replace(/\D/g, ''))}
                            wrapperClassName="monday-storybook-text-field_size"
                          />
                          <div className="m-auto pl-1">
                            <Button onClick={SyncSingleDow} loading={loading||writing} size={Button.sizes.SMALL} disabled={singleDow == ""}>
                              Sync dow
                            </Button>
                          </div>
                        </div>
                      </AccordionItemPanel>
                  </AccordionItem>

                  <AccordionItem>
                      <AccordionItemHeading>
                          <AccordionItemButton>
                              Create new DoW
                          </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <Editor statusSelector={SelectStatusByStatus} groupSelector={SelectGroupByStatus} today={getToday} toggleWriting={toggleWriting} writing={writing} loading={loading} helperboard={contextRef.current?contextRef.current.boardIds:'NoBoardDefined'} domainGroups={domainGroups} monday={monday} remoteMonday={remoteMonday} settings={settings} />
                      </AccordionItemPanel>
                  </AccordionItem>
                </Accordion>
              </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      Troubleshoot
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>

                  <Button onClick={SyncDowData} loading={loading||writing}>
                    Fix Settings
                  </Button>
              </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      FAQ
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                <Accordion allowZeroExpanded allowMultipleExpanded>
                  <AccordionItem>
                      <AccordionItemHeading>
                          <AccordionItemButton>
                              Why not update by default?
                          </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        The purpose of this tool is to help you have a good idea of what DoW's you have open, 
                        what is their status and therefore always remember what is the next step.

                        If the tool updates the information for you then you may forget to actually do the steps required by the new status.
                      </AccordionItemPanel>
                  </AccordionItem>
              </Accordion> 
              </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      About
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                <p className="mb-0">TSE helper v {appVersion}</p>
                <p className="mt-0">Developed by <strong>Steven Jocol</strong></p>
              </AccordionItemPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>);
}

export default Main;