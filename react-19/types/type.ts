export type Todo = {
    _id: string;
    projectId: Project;
    name: string;
    completed: boolean;
    date: string | null;
    time: string;
    priority: string;
}


export type Philosophy = {
    readonly _id: string;
    content: string;
    createdAt: string;
}

export type FlashCard = {
    readonly _id: string;
    // topicId: Topic;
    topicId: string;
    frontContent: string;
    backContent: string;
    createdAt: string;
}

export type Topic = {
    readonly _id: string;
    projectId: Project;
    name: string;
    description: string;
    createdAt: string;
}

export type Memory = {
    _id: string;
    name: string;
    projectId: Project;
    image: string;
    steps: string,
    mins: string;
    kilometers: string;
    calories: string;
    createdAt: string;
}

export type Goal = {
    _id: string;
    name: string;
    projectId: Project;
    time: string;
    startDeadlineDate: Date;
    endDeadlineDate: Date;
    image: string;
    completed: boolean;
}

export type Note = {
    _id: string;
    content: string;
    projectId: Project;
}

export type Project = {
    _id: string;
    name: string;
    emoji: string;
}


export type User = {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    password: string;
    role: string;
}