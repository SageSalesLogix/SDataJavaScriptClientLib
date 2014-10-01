define('spec/SDataBatchRequestTests', [
    'dojo/text!./TestBatch.xml'
], function(xmlText) {
    describe('SDataBatchRequest', function() {
        var service,
            xml = new XML.ObjTree(),
            withResponseContent = function(text) {
                spyOn(Sage.SData.Client.Ajax, 'request').and.callFake(function(options) {
                    options.success.call(options.scope || this, {
                        responseText: text
                    });
                });
            };

        beforeEach(function() {
            service = new Sage.SData.Client.SDataService({
                serverName: 'localhost',
                virtualDirectory: 'sdata',
                applicationName: 'aw',
                contractName: 'dynamic'
            });
        });

        it('can build url for batch', function() {
            var request = new Sage.SData.Client.SDataBatchRequest(service)
                .setResourceKind('employees');

            expect(request.build()).toEqual("http://localhost/sdata/aw/dynamic/-/employees/%24batch");
        });

        it('can add requests to batch', function() {
            var batch = new Sage.SData.Client.SDataBatchRequest(service),
                employeeA = {},
                employeeB = {};

            batch.using(function() {
                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('1')
                    .update(employeeA);

                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('2')
                    .update(employeeB);
            });

            expect(batch.items.length).toEqual(2);
            expect(batch.items[0].url).toEqual("http://localhost/sdata/aw/dynamic/-/employees(1)");
            expect(batch.items[1].url).toEqual("http://localhost/sdata/aw/dynamic/-/employees(2)");
        });

        it('can format feed for batch request', function() {
            spyOn(Sage.SData.Client.Ajax, 'request');

            var batch = new Sage.SData.Client.SDataBatchRequest(service)
                .setResourceKind('employees');

            var employeeA = {
                    '$name': 'Employee',
                    '$etag': 'abc',
                    'Name': 'one'
                },
                employeeB = {
                    '$name': 'Employee',
                    '$etag': 'def',
                    'Name': 'two'
                };

            batch.using(function() {
                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('1')
                    .update(employeeA);

                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('2')
                    .update(employeeB);
            });

            batch.commit();

            (function(formatted) {
                expect(formatted).toHaveProperty('feed');
                expect(formatted).toHaveProperty('feed.entry');
                expect(formatted).toHaveProperty('feed.entry.length', 2);
                expect(formatted).toHaveProperty('feed.entry.0.id', 'http://localhost/sdata/aw/dynamic/-/employees(1)');
                expect(formatted).toHaveProperty('feed.entry.1.id', 'http://localhost/sdata/aw/dynamic/-/employees(2)');
            })(xml.parseXML(Sage.SData.Client.Ajax.request.calls.mostRecent().args[0].body));
        });

        it('can commit batch request', function() {

            withResponseContent(xmlText);

            var success = jasmine.createSpy(),
                failure = jasmine.createSpy();

            var batch = new Sage.SData.Client.SDataBatchRequest(service),
                employeeA = {},
                employeeB = {};

            batch.using(function() {
                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('1')
                    .update(employeeA);

                new Sage.SData.Client.SDataSingleResourceRequest(service)
                    .setResourceKind('employees')
                    .setResourceSelector('2')
                    .update(employeeB);
            });

            batch.commit({
                success: success,
                failure: failure
            });

            expect(success).toHaveBeenCalled();
            expect(failure).not.toHaveBeenCalled();
        });
    });
});
