import { useEffect, useState, useCallback } from 'react';
import '@jetbrains/ring-ui-built/components/style.css';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import Toggle from '@jetbrains/ring-ui-built/components/toggle/toggle';
import Panel from '@jetbrains/ring-ui-built/components/panel/panel';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Group from '@jetbrains/ring-ui-built/components/group/group';
import type { Project } from './types';
import './app.css';
import Loader from "@jetbrains/ring-ui-built/components/loader/loader";

const App = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [globalFlag, setGlobalFlag] = useState(false);
    const [saving, setSaving] = useState(false);
    const [host, setHost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const hostInstance = await YTApp.register();
                setHost(hostInstance);
                console.log('YouTrack App initialized');

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
            await host.fetchApp('backend/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(value)
            });
            alertService.successMessage('Flag saved successfully');
        } catch (err) {
            console.error('Error saving global flag:', err);
            alertService.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    }, [host]);

    const handleToggleChange = useCallback(
        (checked: boolean) => {
            setGlobalFlag(checked);
            void saveFlag(checked);
        },
        [saveFlag]
    );

    if (isLoading) {
        return (
            <Loader message="Loading Test Management…" />
        );
    }

    return (
        <>
            <div
                className="yt-app"
            >
                <Panel className="yt-header">
                    <Heading level={Heading.Levels.H1}>Test Management</Heading>
                    <Text info>
                        Manage the global toggle and explore your YouTrack projects.
                    </Text>
                </Panel>

                <Panel className="yt-panel">
                    <Group>
                        <Heading level={Heading.Levels.H2}>Global Toggle</Heading>
                        {/*{saving && <LoaderInline />}*/}
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
                                        <Text className="yt-project-description">
                                            {project.description}
                                        </Text>
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
        </>
    );
};

export default App;