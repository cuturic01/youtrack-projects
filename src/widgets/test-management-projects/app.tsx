import { useEffect, useState, useCallback } from 'react';
import '@jetbrains/ring-ui-built/components/style.css';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import Toggle from '@jetbrains/ring-ui-built/components/toggle/toggle';
import Panel from '@jetbrains/ring-ui-built/components/panel/panel';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Group from '@jetbrains/ring-ui-built/components/group/group';
import type { Project, ProjectToggleState } from './types';
import {STORAGE_KEY} from "./constants.ts";


const App = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [toggleStates, setToggleStates] = useState<ProjectToggleState>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [host, setHost] = useState<any>(null);

    useEffect(() => {
        const initApp = async () => {
            try {
                const hostInstance = await YTApp.register();
                setHost(hostInstance);
                console.log('YouTrack App initialized');
            } catch (error) {
                console.error('Failed to initialize YouTrack App:', error);
                alertService.error('Failed to connect to YouTrack');
            }
        };

        void initApp();
    }, []);

    const fetchProjects = useCallback(async () => {
        if (!host) {
            console.error('YouTrack App not initialized');
            return;
        }

        try {
            setLoading(true);

            const data: Project[] = await host.fetchYouTrack('admin/projects', {
                query: { fields: 'id,name,shortName' }
            });

            setProjects(data);
        } catch (err) {
            console.error('Error fetching test-management-projects:', err);
            alertService.error(
                err instanceof Error ? err.message : 'Failed to load test-management-projects'
            );
        } finally {
            setLoading(false);
        }
    }, [host]);

    const loadToggleStates = useCallback(async () => {
        if (!host) return;

        try {
            const response = await host.fetchApp(`backend/storage/${STORAGE_KEY}`, {
            });

            if (response) {
                setToggleStates(response as ProjectToggleState);
            }
        } catch (err) {
            console.error('Error loading toggle states:', err);
        }
    }, [host]);

    const saveToggleStates = useCallback(async (newStates: ProjectToggleState) => {
        if (!host) {
            alertService.error('Cannot save: YouTrack not connected');
            return;
        }

        try {
            setSaving(true);
            await host.fetchApp(`backend/storage/${STORAGE_KEY}`, {
                method: 'POST',
                body: newStates
            });
            alertService.successMessage('Settings saved successfully');
        } catch (err) {
            console.error('Error saving toggle states:', err);
            alertService.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    }, [host]);

    const handleToggleChange = useCallback((projectId: string, enabled: boolean) => {
        const newStates: ProjectToggleState = {
            ...toggleStates,
            [projectId]: enabled,
        };
        setToggleStates(newStates);
        void saveToggleStates(newStates);
    }, [toggleStates, saveToggleStates]);

    useEffect(() => {
        if (!host) return;

        const initialize = async () => {
            try {
                await Promise.all([
                    fetchProjects(),
                    loadToggleStates(),
                ]);
            } catch (error) {
                console.error('Failed to initialize app:', error);
            }
        };

        void initialize();
    }, [host, fetchProjects, loadToggleStates]);

    if (!host || loading) {
        return (
            <div className="app-container">
                <Panel>
                    <div className="loading-container">
                        <LoaderInline />
                        <Text>{!host ? 'Connecting to YouTrack...' : 'Loading test-management-projects...'}</Text>
                    </div>
                </Panel>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Panel>
                <Group>
                    <Heading level={Heading.Levels.H1}>
                        Test Management Configuration
                    </Heading>
                    {saving && <LoaderInline />}
                </Group>

                <Text info className="description">
                    Enable or disable test management features for each project.
                </Text>

                {projects.length === 0 ? (
                    <Text info>No projects found in your YouTrack instance.</Text>
                ) : (
                    <div className="projects-list">
                        {projects.map((project) => {
                            const isEnabled = toggleStates[project.id] || false;

                            return (
                                <Panel key={project.id} className="project-item">
                                    <div className="project-info">
                                        <Text className="project-name">{project.name}</Text>
                                        <Text info className="project-key">{project.shortName}</Text>
                                    </div>
                                    <Group className="project-toggle">
                                        <Toggle
                                            checked={isEnabled}
                                            onChange={(e) => handleToggleChange(project.id, e.target.checked)}
                                            disabled={saving}
                                        />
                                        <Text className="toggle-label">
                                            {isEnabled ? 'Enabled' : 'Disabled'}
                                        </Text>
                                    </Group>
                                </Panel>
                            );
                        })}
                    </div>
                )}
            </Panel>
        </div>
    );
};

export default App;