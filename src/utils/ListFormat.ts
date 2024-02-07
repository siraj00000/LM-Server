export const ListFormat = (attribute: any) => {
    if(typeof attribute === 'string'){
        return attribute.split(",")
    }

    return attribute
}