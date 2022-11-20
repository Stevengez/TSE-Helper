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

const DomainKey = 'DomainList';
const MobileDomainKey = 'MobDomainList';
const monday = mondaySdk();
const remoteMonday = mondaySdk();
const appVersion = '3.7.0';

const Main = () => {

  //Settings
  const [settings, setSettings] = useState();
  const [context, setContext] = useState();
  const [boardData, setData] = useState();
  const [userName, setName] = useState('...');
  const [userId, setUserId] = useState();
  const [extUserName, setExtName] = useState();
  const [DowDomainGroups, setDowDomainGroups] = useState([]);
  const [syncDowDomains, setSyncDowDom] = useState([]);

  const [MobDomainGroups, setMobDomainGroups] = useState([]);
  const [syncMobDomains, setSyncMobDom] = useState([]);
  
  const settingsRef = useRef();
        settingsRef.current = settings;

  const contextRef = useRef();
        contextRef.current = context;

  const boardDataRef = useRef();
        boardDataRef.current = boardData;

  const useridRef = useRef();
        useridRef.current = userId;

  const[subBoardDow, setSubDow] = useState();
  const[subBoardMob, setSubMob] = useState();

  const subBoardDowRef = useRef();
        subBoardDowRef.current = subBoardDow;
  const subBoardMobRef = useRef();
        subBoardMobRef.current = subBoardMob;
  
  // Input Values
  const [singleDow, setSingleDow] = useState("");

  //Live Data
  const [myItems, setMyItems] = useState([]);
  const [loading, toggleLoading] = useState(false);
  const [loadingMob, toggleLoadingMob] = useState(false);
  const [writing, toggleWriting] = useState(false);
  const [writingMob, toggleWritingMob] = useState(false);
  
  const myItemsRef = useRef();
        myItemsRef.current = myItems;
  const loadingRef = useRef();
        loadingRef.current = loading;
  const loadingMobRef = useRef();
        loadingMobRef.current = loadingMob;
  const writingRef = useRef();
        writingRef.current = writing;
  const writingMobRef = useRef();
        writingMobRef.current = writingMob;
  
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
        setSyncDowDom(restoredValues);
      }
    });

    monday.storage.instance.getItem(MobileDomainKey).then((res) => {
      if(res.data.value){
        const restoredValues = JSON.parse(res.data.value);
        setSyncMobDom(restoredValues);
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
      if(settings.apitoken.trim() === ""){
        monday.execute("notice", { 
          message: 'You need to set your apitoken.',
          type: "error",
          timeout: 5000,
        });
        return;
      }

      let mondayInterface = remoteMonday;

      if(settings.dowID && settings.dowID.trim() !== ""){
        mondayInterface.api(`query ($board: [Int]){
          me {
            id
            name
          }
          boards(ids: $board){
            columns(ids: ["subitems"]){
              id
              title
              settings_str
            }
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
          if(settings) setUserId(result.data.me.id);
          if(settings) setExtName(result.data.me.name);

          let groups = [];
          if(result.data.boards.length > 0){
            // Set Subitems Board Info
            if(getSubBoard(result.data.boards[0].columns) !== undefined){
              setSubDow(getSubBoard(result.data.boards[0].columns)[0]);
            }

            if(result.data.boards[0].groups.length > 0){
              result.data.boards[0].groups.forEach((g) => {
                groups.push({
                  label: g.title,
                  value: g.id
                });
              });
              setDowDomainGroups(groups);
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

      // Mobile Groups Retrieval
      if(settings.mobileid && settings.mobileid.trim() !== ""){
        mondayInterface.api(`query ($board: [Int]){
          boards(ids: $board){
            columns(ids: ["subitems"]){
              id
              title
              settings_str
            }
            groups {
              id
              title
            }
          }
        }`, {
          variables: {
            board: parseInt(settings.mobileid)
          }
        }).then(result => {
          let groups = [];
          if(result.data.boards.length > 0){
            // Set Subitems Board Info
            setSubMob(getSubBoard(result.data.boards[0].columns));

            if(result.data.boards[0].groups.length > 0){
              result.data.boards[0].groups.forEach((g) => {
                groups.push({
                  label: g.title,
                  value: g.id
                });
              });
              setMobDomainGroups(groups);
            }else{
              monday.execute("notice", { 
                message: `No Domains found for Board [${settings.mobileid}], is it correct?`,
                type: "error", // or "error" (red), or "info" (blue)
                timeout: 5000,
              });
              console.log("No domains found found for: ", settings.mobileid);
            }
          }else{
            monday.execute("notice", { 
              message: `Board [${settings.mobileid}] not found, is it correct?`,
              type: "error", // or "error" (red), or "info" (blue)
              timeout: 5000,
            });
            console.log("No board found for: ", settings.mobileid);
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
          message: `Unable to retrieve domains, Mobile Board is not set`,
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

    if(!settings.dowzdticket || settings.dowzdticket.trim() === ""){
      errorStrig += "* [DoW Col ID] Reporter by BB\n";
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

    if(!settings.dowpersonid || settings.dowpersonid.trim() === ""){
      errorStrig += "* [DoW Col ID] Reporter by BB\n";
      errorPresent = true;
    }

    if(!settings.dowzdticket || settings.dowzdticket.trim() === ""){
      errorStrig += "* [DoW Col ID] ZD Ticket ID\n";
      errorPresent = true;
    }

    if(!settings.dowsubreporter || settings.dowsubreporter.trim() === ""){
      errorStrig += "* [DoW Sub. Col ID] Reporter\n";
      errorPresent = true;
    }

    if(!settings.dowsubzdlink || settings.dowsubzdlink.trim() === ""){
      errorStrig += "* [DoW Sub. Col ID] ZD Ticket ID\n";
      errorPresent = true;
    }

    // Mobile
    if(!settings.mobileid || settings.mobileid.trim() === ""){
      errorStrig += "* Mobile Board ID\n";
      errorPresent = true;
    }

    if(!settings.mobilereporter || settings.mobilereporter.trim() === ""){
      errorStrig += "* [Mobile Col ID] ZD Reporter\n";
      errorPresent = true;
    }

    if(!settings.mobilezdticket || settings.mobilezdticket.trim() === ""){
      errorStrig += "* [Mobile Col ID] ZD Ticket\n";
      errorPresent = true;
    }

    if(!settings.mobilesubreporter || settings.mobilesubreporter.trim() === ""){
      errorStrig += "* [Mobile Sub. Col ID] Reporter\n";
      errorPresent = true;
    }

    if(!settings.mobilesubzdticket || settings.mobilesubzdticket.trim() === ""){
      errorStrig += "* [Mobile Sub. Col ID] ZD Tickete\n";
      errorPresent = true;
    }

    // Local Board

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
    let mondayInterface = remoteMonday;

    mondayInterface.api(`query ($item: [Int]) {
      items(ids: $item) {
        id
        name
        parent_item {
          name
        }
        column_values {
          id
          value
          text
        }
        board {
          id
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
        console.log("res", res);
        const item = items[0];
        if(item.board.id != settings.mobileid){
          if(item.parent_item) item.isSubitem =  true;
          if(item.name == "+1" && item.isSubitem) item.name = item.parent_item.name;
          setMyItems([...myItemsRef.current, item]);
          toggleLoading(false);
          FillBoard(false, true);
        }else{
          if(item.parent_item) item.isSubitem =  true;
          if(item.name == "+1" && item.isSubitem) item.name = item.parent_item.name;
          setMyItems([...myItemsRef.current, item]);
          toggleLoading(false);
          FillBoard(true, true);
        }
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
      getPageItems(settingsRef.current.dowID, syncDowDomains, false).then((_) => {
        toggleLoading(false);
        FillBoard(false);
      });
    }else{
      console.log("Sync pending");
    }
  }

  const SyncMobData = () => {
    const errorString = settingsValidate();
    if(errorString.length > 0){
      monday.execute("notice", { 
        message: errorString,
        type: "error",
        timeout: 5000,
      });
      return;
    }

    if(settingsRef.current.mobileid !== ""){
      toggleLoadingMob(true);
      getPageItems(settingsRef.current.mobileid, syncMobDomains, true).then((_) => {
        toggleLoadingMob(false);
        FillBoard(true);
      });
    }else{
      console.log("Sync pending");
    }
  }

  // const compareItem = (local, remote) => {
  //   if(getText(local, Object.keys(settings.helperdowstatus)[0]) === getText(remote, settings.dowstatus)) return false;
  //   return true;
  // }

  const compareItems = () => {
    const localCopy = boardDataRef.current.slice();
    const remoteCopy = myItemsRef.current.slice();
    
    const RemotePendingCreation = [];

    while(remoteCopy.length > 0){
      let c = 0;
      let found = false;
      
      for(let local_Item of localCopy){
        //const lid = getText(local_Item.column_values, settings.helperdowitemid);
        if(remoteCopy[0].id === getText(local_Item.column_values, Object.keys(settings.helperdowitemid)[0])){
          found = true;
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

    return { create: RemotePendingCreation };
  }

  const FillBoard = (isMobile, isSingleSync = false) => {
    const { create, update } = compareItems();

    // Create Non Existing
    const pendingWorks = [];
    if(isMobile && !isSingleSync){
      toggleWritingMob(true);
    }else{
      toggleWriting(true);
    }

    create.forEach((dow) => {
      console.log("Is mobile: ", isMobile, " is subitem: ", dow.isSubitem, "searched id: ", settings.mobilesubzdticket);
      const dowZDTicketID = getText(dow.column_values, isMobile?(dow.isSubitem?(settings.mobilesubzdticket):(settings.mobilezdticket)):(dow.isSubitem?(settings.dowsubzdlink):(settings.dowzdticket)));
      const jsonValue = {};

      // Set DoW Link
      if(isMobile){
        jsonValue[Object.keys(settings.helperdowlink)[0]] = {
          url:`https://monday.monday.com/boards/${settingsRef.current.mobileid}/pulses/${dow.id}`,
          text: 'Bug Board (Mobile)'
        };
      }else{
        jsonValue[Object.keys(settings.helperdowlink)[0]] = {
          url:`https://monday.monday.com/boards/${dow.board?dow.board.id:settingsRef.current.dowID}/pulses/${dow.id}`,
          text: 'DoW Board'
        };
      }

      // Set ZD Link
      if(dowZDTicketID){
        if(isMobile){
          jsonValue[Object.keys(settings.helperzdlink)[0]] = {
            url:`https://monday.zendesk.com/agent/tickets/${dowZDTicketID}`,
            text: 'ZD Link'
          };
        }else{
          if(dow.isSubitem){
            jsonValue[Object.keys(settings.helperzdlink)[0]] = {
              url:`${dowZDTicketID}`,
              text: 'ZD Link'
            };
          }else{
            jsonValue[Object.keys(settings.helperzdlink)[0]] = {
              url:`https://monday.zendesk.com/agent/tickets/${dowZDTicketID}`,
              text: 'ZD Link'
            };
          }
        }
      }

      // Set DoW RemoteID
      jsonValue[Object.keys(settings.helperdowitemid)[0]] = `${dow.id}`;

      const work = monday.api(`mutation ($itemName: String, $board: Int!, $group: String!, $valuesPack: JSON) {
        create_item(item_name: $itemName, board_id: $board, group_id: $group, column_values: $valuesPack){
          id
        }
      }`, {
        variables: {
          itemName: dow.name,
          board: parseInt(context.boardIds),
          group: settings.backtodev,
          valuesPack: JSON.stringify(jsonValue)
        }
      });

      pendingWorks.push(work);
    });
    
    Promise.all(pendingWorks).then((values) => {
      if(isMobile && !isSingleSync){
        toggleWritingMob(false);
      }else{
        toggleWriting(false);
      }
      
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

  // const getToday = () => {
  //   const date = new Date();
  //   const month = date.getMonth()+1;
  //   const day = date.getDate()+1;
  //   const year = date.getFullYear();
  //   return year+'-'+month+'-'+day;
  // }

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

  const getValue = (column_values, targetId) => {
    const colIdx = column_values.findIndex((c) => {
      return c.id === targetId;
    });

    if(colIdx !== -1){
      return column_values[colIdx].value;
    }else{
      console.log(`${targetId} doesn't exists`);
      return undefined;
    }
  }

  const getSubBoard = (column_values) => {
    const colIdx = column_values.findIndex((c) => {
        return c.id === 'subitems';
    });

    if(colIdx !== -1){
        if(column_values[colIdx]){
            let parsed = JSON.parse(column_values[colIdx].settings_str);
            return parsed.boardIds;
        }else{
            return undefined;
        }
        
    }
  }

  // const SelectStatusByStatus = (status) => {
  //   switch(status){
  //     case 'Back to dev':
  //     case 'New ticket':
  //       return 'Follow Up';
  //     case 'Move back to reporter':
  //       return 'Pending';
  //     case 'Moved to bugs Q':
  //       return 'Long Term Bug';
  //     default:
  //       return 'Follow Up';
  //   }
  // }

  // const SelectGroupByStatus = (status) => {
  //   switch(status){
  //     case 'Back to dev':
  //     case 'New ticket':
  //       return settings.backtodev;
  //     case 'Move back to reporter':
  //       return settings.backtoreporter;
  //     case 'Moved to bugs Q':
  //       return settings.movedtobugs;
  //     default:
  //       return settings.backtodev;
  //   }
    
  // }

  const getPageItems = async (boardid, domaingroup, isMobile = false) => {
    // Select mondayapi based on settings
    let mondayInterface = remoteMonday;

    //Parents
    for(let domain of domaingroup){
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
          board: parseInt(boardid),
          groups: [domain.value],
          columns: [isMobile?settings.mobilezdticket:settings.dowzdticket, isMobile?settings.mobilereporter:settings.dowpersonid]
        }
      });

      const group = result.data.boards[0].groups[0];
      const items = group.items;

      if(items.length > 0){
        const newBatch  = items.filter((i) => {
          const personValue = getValue(i.column_values, isMobile?settings.mobilereporter:settings.dowpersonid);
          if(personValue && i.creator){
            const persons = JSON.parse(personValue);
            if(persons.personsAndTeams){
              const isBBValid = persons.personsAndTeams.find((person) => { return person.id == useridRef.current});
              return i.creator.id === useridRef.current || isBBValid !== undefined;
            }
          }else{
            if(i.creator){
              return i.creator.id === useridRef.current;
            }else{
              return false;
            }
          }
        });
        setMyItems([...myItemsRef.current, ...newBatch]);
      }else{
        console.log(`[${domain}] contained no items.`);
      }
    }

    // SubItems
    if(subBoardDowRef.current !== undefined){
      const result =  await mondayInterface.api(`query ($board: Int!, $column: String!, $username: String! $columns: [String]) {
        items_by_column_values(board_id: $board, column_id: $column, column_value: $username){
          id
          name
          parent_item {
            name
          }
          column_values(ids: $columns) {
            id
            value
            text
          }
        }
      }`, {
        variables: {
          board: parseInt(subBoardDowRef.current),
          username: extUserName?extUserName:userName,
          column: isMobile?settings.mobilesubreporter:settings.dowsubreporter,
          columns: [isMobile?settings.mobilesubzdticket:settings.dowsubzdlink]
        }
      });
      
      const items = result.data.items_by_column_values;
    
      if(items.length > 0){
        items.forEach((i) => {
          if(i.name.trim() == "+1"){
            i.name = i.parent_item.name;
          }
          i.isSubitem = true;
        })
        setMyItems([...myItemsRef.current, ...items]);
      }else{
        console.log(`[Subitems] contained no items.`);
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
                  <p>TSE Helper is a tool developed to help you with follow up of DoW's and Mobile Bugs.</p>
              </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
              <AccordionItemHeading>
                  <AccordionItemButton>
                      How to begin?
                  </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                  <p>First ensure that the settings are all in place, and add your monday.monday API Token. </p>
                  <p>Done? Now you can select which groups will be used to import dow's or mobile bugs.</p>
                  <div className="mb-2">
                  <Select
                        isMulti
                        isSearchable
                        isClearable
                        value={syncDowDomains}
                        placeholder='Select which groups to sync'
                        onChange={(values) => {monday.storage.instance.setItem(DomainKey, JSON.stringify(values)); setSyncDowDom(values)}}
                        options={DowDomainGroups} />
                  </div>
                  <Button onClick={SyncDowData} loading={loading||writing} disabled={loadingMob||writingMob}>
                    <strong>Sync my&nbsp;DoW cases</strong>
                  </Button>
                  
                  <div className="mb-2 mt-2">
                  <Select
                        isMulti
                        isSearchable
                        isClearable
                        value={syncMobDomains}
                        placeholder='Select which groups to sync'
                        onChange={(values) => {monday.storage.instance.setItem(MobileDomainKey, JSON.stringify(values)); setSyncMobDom(values)}}
                        options={MobDomainGroups} />
                  </div>
                  <Button onClick={SyncMobData} loading={loadingMob||writingMob} disabled={loading||writing}>
                    <strong>Sync Mobile cases</strong>
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
                  {/* <AccordionItem>
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
                  </AccordionItem> */}

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
                        {/* <Editor statusSelector={SelectStatusByStatus} groupSelector={SelectGroupByStatus} today={getToday} toggleWriting={toggleWriting} writing={writing} loading={loading} helperboard={contextRef.current?contextRef.current.boardIds:'NoBoardDefined'} DowDomainGroups={DowDomainGroups} monday={monday} remoteMonday={remoteMonday} settings={settings} /> */}
                        Please use Little Brain to create new DoW's.
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
                      <p>Please take a look <a href="https://www.loom.com/share/5389b56d4fa849fb84735ffc5764dff9" target="_blank">here</a>.</p>
                    </AccordionItemPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionItemHeading>
                        <AccordionItemButton>
                            How to setup Chrome Extension?
                        </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <p>With the Pulse Overview chrome extension TSE Helper works even better, by clicking a link that takes you the DoW board, will show you a pop up window to review the ticket there without leaving your local board.</p>
                      <p>To learn how to setup the extension please take a look: <a href="" target="_blank">here</a>.</p>
                    </AccordionItemPanel>
                  </AccordionItem>

                  {/* <AccordionItem>
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
                  </AccordionItem> */}

                  {/* <AccordionItem>
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
                  </AccordionItem> */}

                  {/* <AccordionItem>
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
                  </AccordionItem> */}
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