/*eslint @typescript-eslint/no-unused-vars: "off"*/
import idosell from 'idosell';
import sql from 'sql-bricks';
import firebaseAdmin from 'firebase-admin';
import type { RequestEvent } from './$types';
import { json } from '@sveltejs/kit';
import { NODE_ENV } from "$env/static/private"
import { readFile, writeFile } from "fs/promises"
import { dumpAxiosError, logger, thrower } from '$lib/utils/logger';
import loadJson from '$lib/utils/loadJson';
import saveJson from '$lib/utils/saveJson';

const replace = {
  "Gasoline": "gas",
  "Hybrid": "hybrid",
  "Electric": "electric",
  "Plug-in hybrid": "phev",
  "Mild hybrid": "mhev",
  "Diesel": "diesel",
  "Natural gas": "cng",
  "Hybrid gasoline": "hybrid-gas",
  "Mild hybrid diesel": "mhev-diesel",
  "Ethanol": "ethanol",
  "Hybrid diesel": "hybrid-diesel",
  "Liquefied petroleum gas (lpg)": "lpg",
  "Hydrogen fuel cell": "hydrogen"
}

const runApiTest = async () => {
    // const models = await loadJson('models');
    // const fuels: Set<string> = new Set();
    // const types: Set<string> = new Set();
    // for (const list of Object.values(models)) {
    //     for (const model of list) {
    //         if (model.type.length && model.type.endsWith('s')) {
    //             model.type = model.type.slice(0, -1)
    //         }
    //         model.fuel = model.fuel.map(item => replace[item] ?? item);
    //         for (const fuel of model.fuel) {
    //             fuels.add(fuel);
    //         }
    //         types.add(model.type)
    //     }
    // };
    // await saveJson({ 
    //     fuels: [ ...fuels ],
    //     types: [ ...types ]
    // }, 'carcas')
    // await saveJson(models, 'models', 0)
}






export const GET = async ({ url }: RequestEvent) => {
    if (NODE_ENV !== 'development') throw new Error('ERROR');
    try {
        const data = await runApiTest() as ExplicitAnyToTest;
        if (data instanceof Response) return data;
        return json({ success: true, data });
    } catch (err: unknown) {
        return thrower.endpointSoft(err, true);
    }
}