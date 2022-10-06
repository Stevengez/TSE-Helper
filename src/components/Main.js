import React, { useEffect, useState, useRef } from "react";
import mondaySdk from "monday-sdk-js";
import Select from 'react-select';
import { UrlParser } from "url-params-parser";
import "../App.css";
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

const DomainKey = 'DomainList';
const monday = mondaySdk();
const remoteMonday = mondaySdk();
const appVersion = '3.4.0';

const Main = () => {

  //Settings
  const [settings, setSettings] = useState();
  const [context, setContext] = useState();
  const [boardData, setData] = useState();
  const [userName, setName] = useState('...');
  const [userId, setUserId] = useState();
  const [domainGroups, setDomainGroups] = useState([]);
  const [syncDomains, setSyncDom] = useState([]);
  
  const settingsRef = useRef();
        settingsRef.current = settings;

  const contextRef = useRef();
        contextRef.current = context;

  const boardDataRef = useRef();
        boardDataRef.current = boardData;

  const useridRef = useRef();
        useridRef.current = userId;
  
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
      remoteMonday.setToken(res.data.apitoken);
      setSettings(res.data);
    });

    const uContext = monday.listen("context", res => {
      if(!contextRef.current){
        setContext(res.data);
        setUserId(res.data.user.id);
      }else{
        for(let k in res.data){
          contextRef.current[k] = res.data[k];
        }
        setContext(contextRef.current);
        updateLocalItems();
      }
    });

    //Retrieve domain list
    monday.storage.instance.getItem(DomainKey).then((res) => {
      if(res.data.value){
        const restoredValues = JSON.parse(res.data.value);
        setSyncDom(restoredValues);
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
        if(res.data.boards.length > 0){
          setName(res.data.me.name);
          setData(res.data.boards[0].items);
        }
      });
    }
  }, [context]);

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
        if(res.data.boards.length > 0){
          setData(res.data.boards[0].items);
        }
      });
    }
  }

  // Get Domain Group List
  useEffect(() => {
    if(settings){
      if(settings.externaldow && settings.apitoken.trim() === ""){
        monday.execute("notice", { 
          message: 'You need to set your apitoken.',
          type: "error",
          timeout: 5000,
        });
        return;
      }

      let mondayInterface = monday;
      if(settings.externaldow){
        mondayInterface = remoteMonday;
      }

      if(settings.dowID && settings.dowID.trim() !== ""){
        mondayInterface.api(`query ($board: [Int]){
          me {
            id
          }
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
          // Set User info
          if(settings && settings.externaldow){
            setUserId(result.data.me.id);
            console.log("ID: ", result.data.me.id);
          }

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
        }).catch(error =>{
          monday.execute("notice", { 
            message: `Permission denied, check api token`,
            type: "error", // or "error" (red), or "info" (blue)
            timeout: 5000,
          });
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

  const parseItemLinks = (value) => {
    const regex = /^(http|https):\/\/.+\.monday\.com\/boards\/[0-9]+\/pulses\/[0-9]+(\/posts\/[0-9]+)?(\?.*)?$/;

    if(regex.test(value.toLowerCase().trim())){
      const parserurl = UrlParser(
        value.toLowerCase().trim(),
        "/boards/:boardId/pulses/:itemId/posts/:postid"
      );

      const { itemId } = parserurl.namedParams;
      setSingleDow(itemId);
    }else{
      setSingleDow(value.replace(/\D/g, ''));
    }
  }

  // Open Item CardBoard to see from here
  const OpenLiveView = () => {
    const errorString = settingsLiveValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error",
        timeout: 5000,
      });
      return;
    }

    monday.execute('openAppFeatureModal',{
      urlPath: ``,
      urlParams: {
        live: true,
        itemId: singleDow
      },
      width: 700,
      height: 900
    });
  }


  const settingsLiveValidate = () => {
    let errorStrig = 'Please make sure to fill these settings values: \n';
    let errorPresent = false;

    //console.log("Current Settings: ", settings);

    if(settings.externaldow && settings.apitoken.toString().trim() === ""){
      errorStrig += "* API Token\n";
      errorPresent = true;
    }

    if(!settings.dowID || settings.dowID.trim() === ""){
      errorStrig += "* DoW Board ID\n";
      errorPresent = true;
    }

    if(!settings.dowstatus || settings.dowstatus.trim() === ""){
      errorStrig += "* [DoW Col ID] Status\n";
      errorPresent = true;
    }

    if(!settings.dowlogin || settings.dowlogin.trim() === ""){
      errorStrig += "* [DoW Col ID] Login Permission\n";
      errorPresent = true;
    }

    if(!settings.dowreproducible || settings.dowreproducible.trim() === ""){
      errorStrig += "* [DoW Col ID] Reproducible\n";
      errorPresent = true;
    }

    if(!settings.dowpriority || settings.dowpriority.trim() === ""){
      errorStrig += "* [DoW Col ID] Priority\n";
      errorPresent = true;
    }

    return errorPresent?errorStrig:'';
  }

  // Check Settings
  const settingsValidate = () => {
    let errorStrig = 'Please make sure to fill these settings values: \n';
    let errorPresent = false;

    //console.log("Current Settings: ", settings);

    if(settings.externaldow && settings.apitoken.toString().trim() === ""){
      errorStrig += "* API Token\n";
      errorPresent = true;
    }

    if(!settings.dowID || settings.dowID.trim() === ""){
      errorStrig += "* DoW Board ID\n";
      errorPresent = true;
    }

    if(!settings.slug || settings.slug.trim() === ""){
      errorStrig += "* Account Slug\n";
      errorPresent = true;
    }

    if(!settings.dowstatus || settings.dowstatus.trim() === ""){
      errorStrig += "* [DoW Col ID] Status\n";
      errorPresent = true;
    }

    if(!settings.dowbb || settings.dowbb.trim() === ""){
      errorStrig += "* [DoW Col ID] BigBrain\n";
      errorPresent = true;
    }

    if(!settings.dowlogin || settings.dowlogin.trim() === ""){
      errorStrig += "* [DoW Col ID] Login Permission\n";
      errorPresent = true;
    }

    if(!settings.dowreproducible || settings.dowreproducible.trim() === ""){
      errorStrig += "* [DoW Col ID] Reproducible\n";
      errorPresent = true;
    }

    if(!settings.dowpriority || settings.dowpriority.trim() === ""){
      errorStrig += "* [DoW Col ID] Priority\n";
      errorPresent = true;
    }

    if(!settings.helperstatus || Object.keys(settings.helperstatus).length === 0){
      errorStrig += "* [Local Board] Status\n";
      errorPresent = true;
    }

    if(!settings.helperdowstatus || Object.keys(settings.helperdowstatus).length === 0){
      errorStrig += "* [Local Board] DoW Status\n";
      errorPresent = true;
    }

    if(!settings.helperdowitemid || Object.keys(settings.helperdowitemid).length === 0){
      errorStrig += "* [Local Board] DoW ItemID\n";
      errorPresent = true;
    }

    if(!settings.helperdowlink || Object.keys(settings.helperdowlink).length === 0){
      errorStrig += "* [Local Board] DoW Link\n";
      errorPresent = true;
    }

    if(!settings.helperzdlink || Object.keys(settings.helperzdlink).length === 0){
      errorStrig += "* [Local Board] ZD Link\n";
      errorPresent = true;
    }

    if(!settings.helperdate || Object.keys(settings.helperdate).length === 0){
      errorStrig += "* [Local Board] Followup Date\n";
      errorPresent = true;
    }

    if(!settings.backtodev ||  settings.backtodev.trim() === ""){
      errorStrig += "* [Local Board] Back to Dev\n";
      errorPresent = true;
    }

    if(!settings.backtoreporter || settings.backtoreporter.trim() === ""){
      errorStrig += "* [Local Board] Waiting for Reporter\n";
      errorPresent = true;
    }

    if(!settings.movedtobugs || settings.movedtobugs.trim() === ""){
      errorStrig += "* [Local Board] Moved to bugs\n";
      errorPresent = true;
    }

    return errorPresent?errorStrig:'';
  }

  // Get Single DoW
  const SyncSingleDow = () => {
    const errorString = settingsValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error",
        timeout: 5000,
      });
      return;
    }

    toggleLoading(true);
    let mondayInterface;
    if(settings.externaldow){
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
        console.log(`Dow [${singleDow}] not found.`);
        monday.execute("notice", { 
          message: `Dow [${singleDow}] not found.`,
          type: "error",
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
        type: "error",
        timeout: 5000,
      });
      return;
    }

    if(settingsRef.current.dowID !== ""){
      toggleLoading(true);
      getPageItems().then((_) => {
        toggleLoading(false);
        FillBoard();
      });
    }else{
      console.log("Sync pending");
    }
  }

  const compareItem = (local, remote) => {
    if(getText(local, Object.keys(settings.helperdowstatus)[0]) === getText(remote, settings.dowstatus)) return false;
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
        if(remoteCopy[0].id === getText(local_Item.column_values, Object.keys(settings.helperdowitemid)[0])){
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
          change_column_value(board_id: $board, item_id: $item, column_id: $column, value: $value, create_labels_if_missing: true){
            id
          }
        }`, {
          variables: {
            board: parseInt(context.boardIds),
            item: parseInt(dow.localID),
            column: Object.keys(settings.helperdowstatus)[0],
            value: JSON.stringify(jsonValue)
          }
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
      jsonValue[Object.keys(settings.helperdate)[0]] = {
        date: getToday()
      };

      // Set Local Status
      jsonValue[Object.keys(settings.helperstatus)[0]] = {
        label:localStatus
      };

      // Set DoW Status
      jsonValue[Object.keys(settings.helperdowstatus)[0]] = {
        label:doWStatus
      };

      // Set DoW Link
      jsonValue[Object.keys(settings.helperdowlink)[0]] = {
        url:`https://${settingsRef.current.slug}.monday.com/boards/${settingsRef.current.dowID}/pulses/${dow.id}`,
        text: 'DoW Board'
      };

      // Set DoW RemoteID
      jsonValue[Object.keys(settings.helperdowitemid)[0]] = `${dow.id}`;

      const work = monday.api(`mutation ($itemName: String, $board: Int!, $group: String, $valuesPack: JSON) {
        create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack, create_labels_if_missing: true){
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

      pendingWorks.push(work);
    });
    
    Promise.all(pendingWorks).then((values) => {
      toggleWriting(false);
      let resultMessage = getFillMessageResult(create, update, isSingleSync);
      
      monday.execute("notice", { 
          message: resultMessage,
          type: "success",
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

  const getPageItems = async () => {
    // Select mondayapi based on settings
    let mondayInterface;
    if(settings.externaldow){
      mondayInterface = remoteMonday;
    }else{
      mondayInterface = monday;
    }

    for(let domain of syncDomains){
      const result =  await mondayInterface.api(`query ($board: [Int], $groups: [String], $columns: [String]) {
          boards (ids: $board){
            groups(ids: $groups) {
              items(exclude_nonactive: true) {
                id
                name
                creator {
                  id
                }
                column_values(ids: $columns) {
                  id
                  value
                  text
                }
              }
            }    
          }  
        }
      `, { 
        variables: {
          board: parseInt(settingsRef.current.dowID),
          groups: [domain.value],
          columns: [settings.dowstatus]
        }
      });

      const group = result.data.boards[0].groups[0];
      const items = group.items;

      if(items.length > 0){
        const newBatch  = items.filter((i) => {
          return i.creator.id === useridRef.current;
        });
        setMyItems([...myItemsRef.current, ...newBatch]);
      }else{
        console.log(`[${domain}] contained no items.`);
      }
    }
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
                  <p>First ensure that the settings are all in place, if you are working from your demo account make sure to enable the option "External DoW Board" and add your API Token. </p>
                  <p>Done? Now you can select which domains will be used to import dow's from the DoW Board.</p>
                  <div className="mb-2">
                  <Select
                        isMulti
                        isSearchable
                        isClearable
                        value={syncDomains}
                        placeholder='Select which domains to sync'
                        onChange={(values) => {monday.storage.instance.setItem(DomainKey, JSON.stringify(values)); setSyncDom(values)}}
                        options={domainGroups} />
                  </div>
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
                              DoW live view 
                          </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <div className="d-flex d-row-dir jf-center">
                          <TextField
                            className="m-auto"
                            iconName="fa fa-square"
                            placeholder="item id"
                            value={singleDow.replace(/\D/g, '')}
                            onChange={(value) => parseItemLinks(value)}
                            wrapperClassName="monday-storybook-text-field_size"
                          />
                          <div className="m-auto pl-1">
                            <Button onClick={OpenLiveView} loading={loading||writing} size={Button.sizes.SMALL} disabled={singleDow === ""}>
                              Open live View
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
                            onChange={(value) => parseItemLinks(value)}
                            wrapperClassName="monday-storybook-text-field_size"
                          />
                          <div className="m-auto pl-1">
                            <Button onClick={SyncSingleDow} loading={loading||writing} size={Button.sizes.SMALL} disabled={singleDow === ""}>
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
                  {'Check the settings (: or contact Steven Jocol via Slack'}
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
                            Is there a loom of how to use this?
                        </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <p>Yes there is!</p>
                      <p>Please take a look <a href="">here</a>.</p>
                    </AccordionItemPanel>
                  </AccordionItem>

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

                  <AccordionItem>
                    <AccordionItemHeading>
                        <AccordionItemButton>
                            Why is an update that says "Do not delete" being created with my DoWs?
                        </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <p>This app works directly with the monday API and at the moment is not possible to upload images directly into
                      an update's body.</p><p>In order to workaround that, first a "dummy" update is created to upload the images needed and then the actual DOW update is created with reference to those images uploaded in the previous "dummy" update.</p>
                      <p>If that update gets deleted then the images as well.</p> 
                    </AccordionItemPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionItemHeading>
                        <AccordionItemButton>
                            Can I tag people in my replies from the Live view?
                        </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <p>This app works directly with the monday API and at the moment is not possible to tag someone using the API.</p>
                      <p>To workaround that, the app will send custom notifications to the users you tag including @Everyone in this item, so you don't need to worry about the user not being notified, however they may receive some emails about the notifications with the raw notification content HTML code from the custom notification.</p>
                    </AccordionItemPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionItemHeading>
                        <AccordionItemButton>
                            Why just some monday.com users are available to tag?
                        </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <p>This app aims for efficency, and keeps the request done to the API to the minimum, just requesting the needed items/columns/users.</p>
                      <p>To avoid requesting all the monday users everytime that the live view is used, the available people to tag will be users that already commented, were tagged already or are subscribed to the item as all their information is already in the update/item.</p>
                      <p>If you still need to tag someone is not showing up in the list, please use the browser/desktop app.</p>
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
                <p className="mt-0">Developed by <strong><a style={{color: 'black'}} href="https://monday.monday.com/users/29955490">Steven Jocol</a></strong></p>
                <a href="https://github.com/Stevengez/TSE-Helper" target="blank" style={{textDecoration: 'none'}}>Source Code</a>
              </AccordionItemPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>);
}

export default Main;