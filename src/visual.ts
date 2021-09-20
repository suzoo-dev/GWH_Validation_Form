/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";

import * as React from "react";
import * as ReactDOM from "react-dom";

import axios from 'axios';

import Main from "./main";

import "./../style/visual.less";

const devDb = true; // set to true to point at dev database

const azureEndpointConfig = {
    prod: {
        outcomes: 'https://prod-27.uksouth.logic.azure.com:443/workflows/0ed265ad5d034ac2b32c768fcf90d936/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h10J8CaE-jYoLDvAN6DHPuI6l3SGOLwqZg0Oc5M6z0o',
        outcomeTypes: 'https://prod-15.uksouth.logic.azure.com:443/workflows/fdb27400cea04b1bbc01ac18b5c746ce/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cRKTgkuOGS0zu00PhVI9nxXmsZ2GIYyvAFOHjekVRO4',
        nextActionTypes: 'https://prod-02.uksouth.logic.azure.com:443/workflows/cee8c3392f1b4bb388459c587122c269/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=80abefh6ttpH_b7xGeOWUC3Kx_7-8as3D-ZLhwRcg88'
    },
    dev: {
        outcomes: 'https://prod-18.ukwest.logic.azure.com:443/workflows/73e2975a6e5245969c7d44411541d1ed/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wlaf44fJqatCJG1yHgoCJNsHtODExl2hb2Vf7-yPIc4',
        outcomeTypes: 'https://prod-28.ukwest.logic.azure.com:443/workflows/1e555524e04042d2b42f5c66e275dd11/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7IyAk8qfA4rsdN2lvO6J2RxV_coddc1RY6mmFFI2l3M',
        nextActionTypes: 'https://prod-08.ukwest.logic.azure.com:443/workflows/2b94d32ef65342f58caf9eac8d25a899/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qlNK2JySGovpo1WfiAvasEHV8yD1RDDQ0hUngJgDa6k'
    }
};

export class Visual implements IVisual {
    private settings: VisualSettings;

    private target: HTMLElement;
    private reactRoot: React.ComponentElement<any, any>;

    constructor(options: VisualConstructorOptions) {
        options.element.style.overflow = 'auto';
        this.reactRoot = React.createElement(Main, {});
        this.target = options.element;

        ReactDOM.render(this.reactRoot, this.target)
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0] );

        if(options.dataViews && options.dataViews[0]){
            const dataView: DataView = options.dataViews[0];
            const pathwayKeys = dataView.table.rows.map(row => row[0]).toString()
            
            const endpoints = devDb ? azureEndpointConfig.dev : azureEndpointConfig.prod;

            const outcomes = axios.post(endpoints.outcomes,{
                "pathwayKeys": pathwayKeys
            })

            const outcomeTypes = axios.post(endpoints.outcomeTypes,{
                "Useage": this.settings.outcomeType.useage
            })

            const nextActionTypes = axios.get(endpoints.nextActionTypes)

            axios.all([outcomes, outcomeTypes, nextActionTypes])
                .then(axios.spread((...responses) => {
                    Main.update({
                        rows: dataView.table.rows,
                        columns: dataView.table.columns.map(col => {
                            return {
                                displayName: col.displayName,
                                type: col.type
                            }
                        }),
                        columnHeaders: this.settings.columnHeaders,
                        validations: responses[0].data["Table1"] || [],
                        outcomeTypes: responses[1].data,
                        nextActionTypes: responses[2].data["Table1"],
                        fieldNames: this.settings.fieldNames,
                    });
                })).catch(error => {
                    console.log(error)
                })
        } 
        // else {
        //     this.clear();
        // }
    }

    // private clear() {
    //     Main.update(initialState);
    // }
    
}