// Basic Flutter widget test for DropX Cult app

import 'package:flutter_test/flutter_test.dart';
import 'package:dropxcult_app/main.dart';

void main() {
  testWidgets('DropX Cult app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const DropXCultApp());

    // Verify that the app builds without errors
    expect(find.byType(DropXCultApp), findsOneWidget);
  });
}
