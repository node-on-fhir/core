Profile: ICSRMessageHeader
Parent: USPublicHealthMessageHeader
Id: icsr-messageheader
Title: "ICSR MessageHeader"
Description: "The fields needed to create a MessageHeader for an ICSR Report."
* destination.receiver 0..1 MS
* destination.receiver only Reference(MessageOrganization)
* sender MS
* sender only Reference(MessageOrganization)
* focus 1..1 MS
* focus only Reference(ICSRComposition)
