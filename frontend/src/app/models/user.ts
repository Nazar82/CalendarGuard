export class User {
    constructor(
        public _id: string,
        public createdAt: Date,
        public email: string,
        public name: number,
        public roles: object,
        public updatedAt: Date,
        public username: string,

    ) {}
}