import React, { useEffect, useState } from 'react';
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css"
import Preview from './Preview/Preview';

const monday = mondaySdk();
const remoteMonday = mondaySdk();

const Live = () => {

    const [name, setName] = useState('Loading...');
    const [settings, setSettings] = useState();
    const [context, setContext] = useState();

    useEffect(() => {
        const uContext = monday.listen("context", res => {
            setContext(res.data);
        });
        
        const uSettings = monday.listen("settings", res => {
            remoteMonday.setToken(res.data.apitoken);
            setSettings(res.data);
        });

        return (() => {
            uSettings();
            uContext();
        });
    },[]);

    return (
    <div style={{backgroundColor: '#181b34', minHeight: '100vh'}} className="Container d-flex d-col-dir px-3 pb-3 bg-white">
        <div>
            <h2 className='tx-white'>{name.length > 50 ? name.substring(0,50)+'...':name}</h2>
            <div>
                <Preview settings={settings} context={context} setName={setName} monday={monday} remoteMonday={remoteMonday} />
            </div>
        </div>
    </div>
    );
}

export default Live;