# broadlink-ir-converter

## A small converter library to convert from/to broadlink IR format commands.

The convert implementation between the broadlink IR raw command format to the raw pules array used in common appliance such as Tasmota firmware.

The Tasmota format converting is based on [Broadlink RM2 network protocol](https://github.com/mjg59/python-broadlink/blob/master/protocol.md).

# How to send the command
In Tasmota see [IRSend-RAW-Encoding](https://tasmota.github.io/docs/IRSend-RAW-Encoding/) how to send the pules array.

And to get the pules array just watch the console (or subscribe to Tasmota messages publishing using any mqtt client) and while device detecting a IR pules it will be shown a "IrReceived" message contains "RawData" pules array it's look like 
```json
{"IrReceived":{"Protocol":"GREE","Bits":64,"Data":"0x0x190C6050000000F0","Repeat":0,"IRHVAC":{"Vendor":"GREE" ............},"RawData":[9084,4338,740,1622,.........],"RawDataInfo":[139,139,0]}}
```
Just add to the top of the pules the frequency (or 0 for IR) before converting to broadlink format.

To read or send the data using broadlink see [python-broadlink](https://github.com/mjg59/python-broadlink)
(The implementation is available in other common languages such as [broadlinkjs](https://github.com/momodalo/broadlinkjs)). 

## Install via NPM

```bash 

npm install broadlink-ir-converter

```

## Using examples

```typescript
import { broadlinkToPulesArray, pulesArrayToBroadlink } from 'broadlink-ir-converter';

const broadlinkCommand = '2600920000012991173517101711173417351710171117101711171116351735161117111611171117101711171017111710173517341711171017111710171117341711173417111710173517111600028f1711171116111711161117111611171117101711171017111710171117101711171017111710171117101711171017111710171117111611173516351735163517000d05000000000000';

const pulesArray = [0,8953,4324,609,1522,609,395,609,426,609,1492,609,1522,609,395,609,426,609,395,609,426,609,426,578,1522,609,1522,578,426,609,426,578,426,609,426,609,395,609,426,609,395,609,426,609,395,609,1522,609,1492,609,426,609,395,609,426,609,395,609,426,609,1492,609,426,609,1492,609,426,609,395,609,1522,609,426,578,19855,609,426,609,426,578,426,609,426,578,426,609,426,578,426,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,426,578,426,609,1522,578,1522,609,1522,578,1522,609];

const convertedPulesArray = broadlinkToPulesArray(broadlinkCommand);
const convertedBroadlinkCommand = pulesArrayToBroadlink(pulesArray);


console.log(JSON.stringify(convertedPulesArray)); // [0,8953,4324,609,1522,609,395,609,426,609,1492,609,1522,609,395,609,426,609,395,609,426,609,426,578,1522,609,1522,578,426,609,426,578,426,609,426,609,395,609,426,609,395,609,426,609,395,609,1522,609,1492,609,426,609,395,609,426,609,395,609,426,609,1492,609,426,609,1492,609,426,609,395,609,1522,609,426,578,19855,609,426,609,426,578,426,609,426,578,426,609,426,578,426,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,395,609,426,609,426,578,426,609,1522,578,1522,609,1522,578,1522,609]
console.log(convertedBroadlinkCommand); // '2600920000012991173517101711173417351710171117101711171116351735161117111611171117101711171017111710173517341711171017111710171117341711173417111710173517111600028f1711171116111711161117111611171117101711171017111710171117101711171017111710171117101711171017111710171117111611173516351735163517000d05000000000000


```
