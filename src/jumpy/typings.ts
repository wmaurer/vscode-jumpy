export type Callback = (...args: any[]) => void;

export type Nullable<T> = T | null;

export interface ExtensionComponent {
    activate: Callback;
    deactivate: Callback;
}
