export interface Project {
    id: string;
    name: string;
    shortName: string;
}

export interface ProjectToggleState {
    [projectId: string]: boolean;
}