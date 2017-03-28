/**
 * Created by jeremy.bunting on 3/27/17.
 */
var program = require('commander');
program
    .version('0.1')
    .description('a CLI for announcing ETA to your loved one')
    .option('-d, --direction <destination>', 'The direction you intend to travel in')
    .parse(process.argv);

if(program.direction){
    let home = process.env.HOME_ADDRESS;
    let work = process.env.WORK_ADDRESS;
    var from, to;

    if( program.direction == 'home'){
        from = work, to = home;
        console.log('work -> home')
    } else if( program.direction == 'work'){
        from = home, to = work;
        console.log('home -> work')
    } else {
        console.log('not a valid destination')
    }

    requestAndNotifyETA(from, to).then(response=>{
        console.log(`Response sent, ETA process complete ::: ${new Date()}`)
        notifier.notify(response);
    }).catch(err=> {
        console.error(err)
        notifier.notify(err);
    });
}


