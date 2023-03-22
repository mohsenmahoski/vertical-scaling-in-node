import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cluster from 'cluster';
import { cpus } from 'os';
import * as net from "net";

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(3000);
// }
// bootstrap();

const clusterModule = cluster as unknown as cluster.Cluster;
const numCPUs = cpus().length;
const workers = {};

let index = 0;
const getWorkerIndex = () => {
    index += 1;
    if(index === numCPUs){
        index = 0;
    }
    return index;
};

async function bootstrap() {
  if (clusterModule.isPrimary) {
    console.log(`
             Master server started,proccess.pid:${process.pid},
             number of cpus: ${numCPUs}
    `);
    for (let i = 0; i < numCPUs; i++) { 
          workers[i] = clusterModule.fork();
          workers[i].on('exit',(worker, code, signal) => {
             console.log(`
                      Worker with code: ${code} Restarting...
             `);
             workers[i] = clusterModule.fork();
          });
    }

    net.createServer({ pauseOnConnect: true },
        (connection)=>{
           const workerIndex = getWorkerIndex();
           workers[workerIndex].send('sticky-session:connection', connection);
    }).listen(3000);

  } else {
    const app = await NestFactory.create(AppModule);  
    console.log(`
       Worker server started, process.pid: ${process.pid}
    `);
    const server = await app.listen(0);
    process.on('message', (message, connection: any) => {
        if (message !== 'sticky-session:connection') {
          return;
        }
       server.emit('connection', connection);
       connection.resume();
    });
  }
}
bootstrap();