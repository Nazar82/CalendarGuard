export class User {
    constructor(
        public _id: string,
        public createdAt: Date,
        public email: string,
        public name: number,
        public request: {
             reason: string,
            requestDate: Date
        },
        public roles: {
            __global_roles__: any
        },
        public updatedAt: Date,
        public username: string,

    ) {}
}
