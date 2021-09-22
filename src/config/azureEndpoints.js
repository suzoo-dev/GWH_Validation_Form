const azureEndpointConfig = {
    prod: {
        outcomes: 'https://prod-27.uksouth.logic.azure.com:443/workflows/0ed265ad5d034ac2b32c768fcf90d936/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h10J8CaE-jYoLDvAN6DHPuI6l3SGOLwqZg0Oc5M6z0o',
        outcomeTypes: 'https://prod-15.uksouth.logic.azure.com:443/workflows/fdb27400cea04b1bbc01ac18b5c746ce/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cRKTgkuOGS0zu00PhVI9nxXmsZ2GIYyvAFOHjekVRO4',
        nextActionTypes: 'https://prod-02.uksouth.logic.azure.com:443/workflows/cee8c3392f1b4bb388459c587122c269/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=80abefh6ttpH_b7xGeOWUC3Kx_7-8as3D-ZLhwRcg88',
        addValidation: 'https://prod-03.uksouth.logic.azure.com:443/workflows/aa8fcea4df1a46ce939fc01559b5dee6/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R385vl9UV9_nvdQ5yLc_B-_EFeZnyZIQ8Ou_XjREWhg',
        deleteValidation: 'https://prod-31.uksouth.logic.azure.com:443/workflows/ade191d6d452440fb6b41d687f8f9ea2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=upvRkk4EohJFm7g2NMaRYvnUqKabmDMsKz2-lQQXUFU'
    },
    dev: {
        outcomes: 'https://prod-18.ukwest.logic.azure.com:443/workflows/73e2975a6e5245969c7d44411541d1ed/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wlaf44fJqatCJG1yHgoCJNsHtODExl2hb2Vf7-yPIc4',
        outcomeTypes: 'https://prod-28.ukwest.logic.azure.com:443/workflows/1e555524e04042d2b42f5c66e275dd11/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7IyAk8qfA4rsdN2lvO6J2RxV_coddc1RY6mmFFI2l3M',
        nextActionTypes: 'https://prod-08.ukwest.logic.azure.com:443/workflows/2b94d32ef65342f58caf9eac8d25a899/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qlNK2JySGovpo1WfiAvasEHV8yD1RDDQ0hUngJgDa6k',
        addValidation: 'https://prod-01.ukwest.logic.azure.com:443/workflows/7c0aee417934481db5ca9167cfe9e7b5/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZPrz-T0KyTXFlUr0onZj8ktYjbvGaY9EV9Mdmi4amc0',
        deleteValidation: 'https://prod-00.ukwest.logic.azure.com:443/workflows/83c7e679e0504320860dff4a49835d80/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BOQLsfnNXm--l72s-3hZOr_JzBZ-F1OZ6tPLbQdl214'
    }
}

export default azureEndpointConfig;