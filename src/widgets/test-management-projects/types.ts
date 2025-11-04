export interface Project {
    id: string;
    name: string;
    shortName: string;
    description?: string;
    leader?: {
        name: string;
        login: string;
    };
}
