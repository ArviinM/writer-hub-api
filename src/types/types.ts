export interface Company {
    id?: number;
    logo: string;
    name: string;
    status: 'Active' | 'Inactive';
}

export interface User {
    id?: number;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    type: 'Writer' | 'Editor';
    status: 'Active' | 'Inactive';
    accessToken?: string;
    refreshToken?: string;
}

export interface Article {
    id?: number;
    image: string | File;
    title: string;
    link: string;
    date: string;
    content: string;
    status: 'For Edit' | 'Published';
    writerId?: number;
    editorId?: number;
    companyId: number;
}
