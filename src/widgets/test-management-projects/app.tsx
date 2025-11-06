import { useEffect, useState, useCallback } from 'react';
import '@jetbrains/ring-ui-built/components/style.css';
import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import Toggle from '@jetbrains/ring-ui-built/components/toggle/toggle';
import Panel from '@jetbrains/ring-ui-built/components/panel/panel';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Group from '@jetbrains/ring-ui-built/components/group/group';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import type { Project } from './types';

import './app.css';

const App = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [globalFlag, setGlobalFlag] = useState(false);
    const [version, setVersion] = useState<number>(0);
    const [timestamp, setTimestamp] = useState<number>(0);
    const [clientId, setClientId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [host, setHost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const hostInstance = await YTApp.register();
                setHost(hostInstance);

                const projectData: Project[] = await hostInstance.fetchYouTrack('admin/projects', {
                    query: { fields: 'id,name,shortName,description,leader(name,login)' }
                });
                setProjects(projectData);

                const response: any = await hostInstance.fetchApp('backend/toggle', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response && typeof response.toggle === 'boolean') {
                    setGlobalFlag(response.toggle);
                    setVersion(response.version || 0);
                    setTimestamp(response.timestamp || 0);
                    setClientId(response.clientId || 'system');
                }

                setTimeout(() => setIsLoading(false), 100);
            } catch (error) {
                console.error('Initialization error:', error);
                alertService.error('Failed to initialize app');
                setTimeout(() => setIsLoading(false), 100);
            }
        };

        void init();
    }, []);

    const saveFlag = useCallback(async (value: boolean) => {
        if (!host) {
            alertService.error('Cannot save: YouTrack not connected');
            return;
        }

        try {
            setSaving(true);

            const userInfo: any = await host.fetchYouTrack('users/me', {
                query: { fields: 'id,login' }
            });

            const payload = {
                toggle: value,
                expectedVersion: version,
                clientId: userInfo.login + '-' + userInfo.id
            };

            const response = await host.fetchApp('backend/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.conflict) {
                alertService.warning(
                    response.message || 'Update conflict. Reloading latest state...'
                );

                const latest = response.latest;
                setGlobalFlag(latest.toggle);
                setVersion(latest.version);
                setTimestamp(latest.timestamp);
                setClientId(latest.clientId);

                setTimeout(() => {
                    void saveFlag(value);
                }, 500);
            } else if (response.success) {
                setVersion(response.version);
                setTimestamp(response.timestamp);
                setClientId(response.clientId);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err: any) {
            console.error('Error saving global flag:', err);
            alertService.error(err.message || 'Failed to save changes');

            try {
                const response = await host.fetchApp('backend/toggle', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response) {
                    setGlobalFlag(response.toggle);
                    setVersion(response.version || 0);
                    setTimestamp(response.timestamp || 0);
                    setClientId(response.clientId || 'system');
                }
            } catch (reloadErr) {
                console.error('Failed to reload state:', reloadErr);
            }
        } finally {
            setSaving(false);
        }
    }, [host, version]);


    const handleToggleChange = useCallback(
        (checked: boolean) => {
            setGlobalFlag(checked);
            void saveFlag(checked);
        },
        [saveFlag]
    );

    if (isLoading) {
        return <Loader message="Loading Test Management…" />;
    }

    return (
        <div className="yt-app">

            <Panel className="yt-panel">
                <Group>
                    <Heading level={Heading.Levels.H2}>Global Toggle</Heading>
                </Group>

                <div className="yt-toggle-section">
                    <Toggle
                        checked={globalFlag}
                        onChange={(e) => handleToggleChange(e.target.checked)}
                        disabled={saving}
                    />
                    <Text className="yt-toggle-label">
                        {globalFlag ? 'Enabled' : 'Disabled'}
                    </Text>
                </div>

                <Text info style={{ marginTop: 8 }}>
                    Version: <b>{version}</b>, Last updated: <b>{new Date(timestamp).toLocaleString()}</b> by <b>{clientId}</b>
                </Text>

                <div className="yt-section-spacer" />

                <Heading level={Heading.Levels.H3}>Projects</Heading>
                <Text info>The list below shows all active projects.</Text>

                <div className="yt-projects-list">
                    {projects.length === 0 ? (
                        <Text info>No projects found.</Text>
                    ) : (
                        projects.map((project) => (
                            <div key={project.id} className="yt-project-card">
                                <div className="yt-project-header">
                                    <Text className="yt-project-title">{project.name}</Text>
                                    <Text className="yt-project-key">{project.shortName}</Text>
                                </div>
                                {project.description && (
                                    <Text className="yt-project-description">{project.description}</Text>
                                )}
                                {project.leader && (
                                    <Text info className="yt-project-leader">
                                        Leader: {project.leader.name} ({project.leader.login})
                                    </Text>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Panel>
        </div>
    );
};

export default App;
