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
        <div className="LiveContainer px-2 pb-2 noscroll">
            <Preview settings={settings} context={context} setName={setName} monday={monday} remoteMonday={remoteMonday} />
        </div>
    );
}

export default Live;