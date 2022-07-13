import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css"
import Preview from './Preview/Preview';

const monday = mondaySdk();
const remoteMonday = mondaySdk();

const Live = () => {

    const params = new URLSearchParams(window.location.search);
    const itemID = params.has('itemId') ? parseInt(params.get('itemId')):0;
    const [settings, setSettings] = useState();

    useEffect(() => {
        const uSettings = monday.listen("settings", res => {
          // Default values
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
    
          console.log("Live Settings upon set: ", res.data)
          remoteMonday.setToken(tempSettings.apitoken);    
          setSettings(res.data);
          
        });

        return (() => {
            uSettings();
        });
    },[]);

    return (
    <div style={{backgroundColor: '#181b34', minHeight: '100vh'}} className="Container d-flex d-col-dir px-3 pb-3 bg-white">
        <div>
            <h2 className='tx-white'>Live Preview of {itemID}</h2>
            <div>
                <Preview settings={settings} monday={monday} remoteMonday={remoteMonday} />
            </div>
        </div>
    </div>
    );
}

export default Live;