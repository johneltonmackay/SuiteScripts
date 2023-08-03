/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    (record, search) => {
        const STATES = ['CA','NC','WA']
		const CAT_COMPANY = '6'
		let AVATAX = '1295'
		let NO_REPORT = '1293'

        const FIELD = {
            TAXABLE:'taxable',
            AVA_CERTIFICATE:'custentity_ava_exemptcertno',
			CATEGORY:'category',
			TAX_ITEM:'taxitem'
        }

        const SEARCH = {
            TYPE:'customer',
            INTERNAL_ID: 'internalid',
            DEFAULT_SHIPPING:'isdefaultshipping',
            TRUE:'T',
            STATE:'state',
            SHIP_ADDRESS:'shippingAddress'
        }

        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT){
                let objRecord = scriptContext.newRecord
                let objOldRecord = scriptContext.oldRecord
                let strRecordId = objRecord.id
                log.debug('strRecordId',strRecordId)
                let strRecordType = objRecord.type
                let strCertificate = objRecord.getValue({
                    fieldId: FIELD.AVA_CERTIFICATE
                })
                log.debug('strCertificate',strCertificate)

                let blnTaxable = objRecord.getValue({
                    fieldId: FIELD.TAXABLE
                })
                log.debug('blnTaxable',blnTaxable)

                let bolState = searchState(strRecordId)
                log.debug('bolState',bolState)
                let taxableValue;
                try{
                    taxableValue = bolState && !strCertificate || blnTaxable;

                    if (blnTaxable === false){
                        taxableValue = false
                    }

                    record.submitFields({
                        type: strRecordType,
                        id: strRecordId,
                        values: {
                            [FIELD.TAXABLE]: taxableValue
                        }
                    });
                }catch(err){
                    log.error('ERROR IN SETTING TAXABLE BOX',err)
                }
				
				try{
					let strCategory = objRecord.getValue({
						fieldId: FIELD.CATEGORY
					})
					
					if(strCategory === CAT_COMPANY){
                        if (objRecord.getValue('taxitem') != objOldRecord.getValue('taxitem')) {
                            NO_REPORT = objRecord.getValue('taxitem');
                        }
						 record.submitFields({
                            type:strRecordType,
                            id: strRecordId,
                            values:{
                                [FIELD.TAX_ITEM]:NO_REPORT,
								[FIELD.TAXABLE]:taxableValue
                            }
                        })	
					}else{
                        if (objRecord.getValue('taxitem') != objOldRecord.getValue('taxitem')) {
                            AVATAX = objRecord.getValue('taxitem');
                        }
						 record.submitFields({
                            type:strRecordType,
                            id: strRecordId,
                            values:{
                                [FIELD.TAX_ITEM]:AVATAX
                            }
                        })	
					}						
				}catch(err){
					log.error('ERROR SETTTING TAXABLE ITEM',err)
				}	
            }
        }

        //This function searches for the state and returns true or false depending on the condition
        const searchState =(strRecordId) => {
            let strState
            let objSearch = search.create({
                type: SEARCH.TYPE,
                filters:[
                    search.createFilter({name: SEARCH.INTERNAL_ID, operator: search.Operator.ANYOF, values:strRecordId}),
                    search.createFilter({name: SEARCH.DEFAULT_SHIPPING, operator: search.Operator.IS, values: SEARCH.TRUE})
                ],
                columns:[
                    search.createColumn({name:SEARCH.STATE, join:SEARCH.SHIP_ADDRESS})
                ]
            })

            objSearch.run().each(function (result){
                strState = result.getValue({
                    name:SEARCH.STATE,
                    join:SEARCH.SHIP_ADDRESS
                })
            })

            return STATES.includes(strState)
        }

        return {afterSubmit}
    });
