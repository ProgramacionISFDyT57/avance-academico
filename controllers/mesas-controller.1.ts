import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';

export class MesasController {
    private db:IDatabase<any>;

    constructor(db:IDatabase<any>) {
        this.db = db;
        
    }

    
}