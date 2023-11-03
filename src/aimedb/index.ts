import { Socket } from "net";

import { dispatch } from "./handler";
import { setup } from "./pipeline";
import { DataSource } from "../sql/api";
import { SqlRepositories } from "./sql";

export default function aimedb(db: DataSource) {
  return async function(socket: Socket) {
    console.log("Connection opened");

    const { input, output } = setup(socket);

    for await (const obj of input) {
        try 
        {
            const now = new Date();
            const req = obj;
            const res = await db.transaction(txn =>
              dispatch(new SqlRepositories(txn), req, now)
            );
    
            if (res === undefined) 
            {
                console.log("Closing connection");
    
                break;
            }
    
            output.write(res);

        } 
        catch (e)
        {
            console.log("Connection error: " + e);
    
            break;
        }
    }

    console.log("Connection closed");
    socket.end();
  };
}
