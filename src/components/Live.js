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
    const [name, setName] = useState('Loading...');
    const [settings, setSettings] = useState();

    useEffect(() => {
        const uSettings = monday.listen("settings", res => {
          remoteMonday.setToken(res.data.apitoken);
          setSettings(res.data);
        });

        return (() => {
            uSettings();
        });
    },[]);

    return (
    <div style={{backgroundColor: '#181b34', minHeight: '100vh'}} className="Container d-flex d-col-dir px-3 pb-3 bg-white">
        <div>
            <h2 className='tx-white'>{name.length > 50 ? name.substring(0,50)+'...':name}</h2>
            <div>
                <Preview settings={settings} setName={setName} monday={monday} remoteMonday={remoteMonday} />
            </div>
        </div>
    </div>
    );
}

export default Live;