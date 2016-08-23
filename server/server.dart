import 'dart:io';
import 'package:http_server/http_server.dart';
import 'package:path/path.dart';

main() async {
  var pathToBuild = join(dirname(Platform.script.toFilePath()));
  pathToBuild += Platform.pathSeparator + "..";

  print(pathToBuild);

  var staticFiles = new VirtualDirectory(pathToBuild);
  staticFiles.allowDirectoryListing = true;
  staticFiles.directoryHandler = (dir, request) {
    var indexUri = new Uri.file(dir.path).resolve('index.html');
    staticFiles.serveFile(new File(indexUri.toFilePath()), request);
  };

  var server =
      await HttpServer.bind(InternetAddress.LOOPBACK_IP_V4, 4048);
  print('Listening on port 4048');
  await server.forEach(staticFiles.serveRequest);
}